import { NextRequest, NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { rateLimit } from '@/lib/rateLimit';
import { dealerPriceForMoc } from '@/lib/b2bPrice';
import { sendOrderAck, sendOrderNotifyToAdmin, OrderEmailItem } from '@/lib/orderEmail';
import { isVariantOrderable } from '@/lib/availability';

export const dynamic = 'force-dynamic';

// Objednávky partnerů. Košík posílá jen {productId, variantId, quantity} —
// ceny se počítají VÝHRADNĚ tady na serveru podle cenové skupiny partnera,
// klientský snapshot je jen zobrazovací.

const MAX_LINES = 200;
const MAX_QTY = 99;
const MAX_NOTE = 2000;

interface OrderLineInput {
    productId: string;
    variantId: string;
    quantity: number;
}

export async function POST(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await rateLimit(`order:${customer.uid}`, 10, 3600))) {
            return NextResponse.json({ error: 'Příliš mnoho objednávek, zkuste to později.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const rawItems: unknown = body?.items;
        const note = typeof body?.note === 'string' ? body.note.slice(0, MAX_NOTE).trim() : '';

        if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_LINES) {
            return NextResponse.json({ error: 'Neplatné položky objednávky.' }, { status: 400 });
        }

        // Validace + sloučení duplicitních řádků
        const merged = new Map<string, OrderLineInput>();
        for (const raw of rawItems) {
            const productId = typeof raw?.productId === 'string' ? raw.productId.trim() : '';
            const variantId = typeof raw?.variantId === 'string' ? raw.variantId.trim() : '';
            const quantity = Math.round(Number(raw?.quantity));
            if (!productId || !variantId || !Number.isFinite(quantity) || quantity < 1) {
                return NextResponse.json({ error: 'Neplatná položka objednávky.' }, { status: 400 });
            }
            const key = `${productId}|${variantId}`;
            const existing = merged.get(key);
            merged.set(key, {
                productId,
                variantId,
                quantity: Math.min(MAX_QTY, (existing?.quantity || 0) + quantity),
            });
        }
        const lines = Array.from(merged.values());

        // Načtení produktů (batch po 100) a rozklíčování variant
        const productIds = Array.from(new Set(lines.map(l => l.productId)));
        const productMap = new Map<string, Record<string, unknown>>();
        for (let i = 0; i < productIds.length; i += 100) {
            const refs = productIds.slice(i, i + 100).map(id => adminDb.collection('products_v2').doc(id));
            const snaps = await adminDb.getAll(...refs);
            snaps.forEach(s => { if (s.exists) productMap.set(s.id, s.data() as Record<string, unknown>); });
        }

        const items: (OrderEmailItem & { productId: string })[] = [];
        for (const line of lines) {
            const product = productMap.get(line.productId);
            if (!product) {
                return NextResponse.json({ error: `Produkt ${line.productId} neexistuje.` }, { status: 400 });
            }
            // Předobjednávkové ročníky mají vlastní flow (preorder_orders) — do
            // běžných objednávek nepatří, i kdyby klient guard obešel.
            if (product.preorderOnly === true) {
                return NextResponse.json(
                    { error: `${product.brand || ''} ${product.model || ''} je předobjednávkové kolo — objednejte ho v sekci Předobjednávky.`.trim() },
                    { status: 400 },
                );
            }
            const variants: Record<string, unknown>[] = Array.isArray(product.variants) ? product.variants as Record<string, unknown>[] : [];
            const variant = variants.find(v => String(v.id) === line.variantId);
            if (!variant) {
                return NextResponse.json({ error: `Varianta ${line.variantId} neexistuje.` }, { status: 400 });
            }

            // Stejné pravidlo dostupnosti jako UI — klientovi nevěříme.
            if (!isVariantOrderable(product, variant)) {
                const label = `${product.brand || ''} ${product.model || ''}${variant.size ? `, vel. ${variant.size}` : ''}`.trim();
                return NextResponse.json(
                    { error: `${label} není aktuálně dostupné — odeberte položku z košíku.` },
                    { status: 400 },
                );
            }

            // Závazná VOC — stejná logika jako na detailu, ale ze serverových dat:
            // explicitní b2bPrice varianty > manuální cena produktu > cenová skupina.
            const moc = Number(variant.price) || null;
            let unitPrice: number | null = dealerPriceForMoc(
                product as Parameters<typeof dealerPriceForMoc>[0],
                customer.priceLevel,
                moc,
            );
            const variantB2b = Number(variant.b2bPrice) || 0;
            const rootManual = Number(product.manualB2BPrice) || Number(product.b2bPrice) || 0;
            if (variantB2b > 0) unitPrice = variantB2b;
            else if (rootManual > 0) unitPrice = rootManual;

            items.push({
                productId: line.productId,
                variantId: line.variantId,
                quantity: line.quantity,
                brand: String(product.brand || ''),
                model: String(product.model || ''),
                year: Number(product.year) || 0,
                color: String(variant.color || ''),
                size: String(variant.size || ''),
                frameShape: variant.frameShape ? String(variant.frameShape) : undefined,
                capacity: variant.capacity ? String(variant.capacity) : undefined,
                unitPriceCzk: unitPrice != null ? Math.round(unitPrice) : null,
            });
        }

        const totalCzk = items.reduce((s, i) => s + (i.unitPriceCzk || 0) * i.quantity, 0);
        const itemCount = items.reduce((s, i) => s + i.quantity, 0);
        const now = new Date().toISOString();

        const orderRef = await adminDb.collection('orders').add({
            status: 'new',
            createdAt: now,
            updatedAt: now,
            uid: customer.uid,
            email: customer.email,
            customer: {
                companyName: customer.companyName,
                contactName: customer.contactName,
                phone: customer.phone,
                priceLevel: customer.priceLevel || null,
            },
            note,
            itemCount,
            totalCzk,
            items,
        });

        // E-maily best-effort — objednávka už je uložená
        const emailData = {
            orderId: orderRef.id,
            email: customer.email,
            companyName: customer.companyName,
            contactName: customer.contactName,
            phone: customer.phone,
            priceLevel: customer.priceLevel,
            note,
            items,
            totalCzk,
        };
        // after(): odešle se garantovaně po odeslání odpovědi — pouhé
        // void Promise na Vercelu často neproběhlo (funkce se zmrazila)
        after(() => Promise.allSettled([
            sendOrderNotifyToAdmin(emailData),
            sendOrderAck(emailData),
        ]));

        return NextResponse.json({ ok: true, orderId: orderRef.id, totalCzk, itemCount });
    } catch (error) {
        console.error('Order create error:', error);
        return NextResponse.json({ error: 'Objednávku se nepodařilo odeslat.' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Bez orderBy (žádný composite index) — řadíme v paměti, objednávek
        // na partnera jsou jednotky až desítky.
        const snap = await adminDb.collection('orders')
            .where('uid', '==', customer.uid)
            .limit(200)
            .get();

        const orders = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as { id: string; createdAt?: string }))
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

        return NextResponse.json({ orders }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('Order list error:', error);
        return NextResponse.json({ error: 'Objednávky se nepodařilo načíst.' }, { status: 500 });
    }
}
