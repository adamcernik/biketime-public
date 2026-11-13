import { NextRequest, NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { rateLimit } from '@/lib/rateLimit';
import { sendOrderAck, sendOrderNotifyToAdmin, OrderEmailItem } from '@/lib/orderEmail';
import { loadActiveItems, loadOrderedCounts, loadTopAkceSettings, sizeLabel, toPublicItem, TOP_AKCE_SOURCE } from '@/lib/topAkce';

export const dynamic = 'force-dynamic';

/**
 * POST /api/top-akce/order — objednávka z akční nabídky TOP AKCE.
 *
 * Klient posílá jen { items: [{ artNr, quantity }], note }. Ceny (VOC v CZK
 * kurzem, akční MOC) i dostupnost se počítají VÝHRADNĚ tady ze serverových
 * dat. Objednávka se ukládá do běžné kolekce `orders` se `source: 'top-akce'`
 * (variantId = artNr), takže ji partner vidí v klientské zóně a admin
 * v Objednávkách; nezrušené objednávky zároveň snižují dostupné kusy
 * v nabídce. Objednávka je nezávazná do potvrzení — e-maily to říkají.
 */

const MAX_LINES = 100;
const MAX_QTY = 99;
const MAX_NOTE = 2000;

export async function POST(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!(await rateLimit(`top-akce-order:${customer.uid}`, 10, 3600))) {
            return NextResponse.json({ error: 'Příliš mnoho objednávek, zkuste to později.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const rawItems: unknown = body?.items;
        const note = typeof body?.note === 'string' ? body.note.slice(0, MAX_NOTE).trim() : '';
        if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_LINES) {
            return NextResponse.json({ error: 'Neplatné položky objednávky.' }, { status: 400 });
        }

        // Validace + sloučení duplicit
        const merged = new Map<string, number>();
        for (const raw of rawItems) {
            const artNr = typeof raw?.artNr === 'string' ? raw.artNr.replace(/\D/g, '') : '';
            const quantity = Math.round(Number(raw?.quantity));
            if (!artNr || !Number.isFinite(quantity) || quantity < 1) {
                return NextResponse.json({ error: 'Neplatná položka objednávky.' }, { status: 400 });
            }
            merged.set(artNr, Math.min(MAX_QTY, (merged.get(artNr) || 0) + quantity));
        }

        const settings = await loadTopAkceSettings();
        if (!settings.published) {
            return NextResponse.json({ error: 'Akční nabídka momentálně není aktivní.' }, { status: 400 });
        }
        const [docs, ordered] = await Promise.all([loadActiveItems(), loadOrderedCounts()]);
        const byArt = new Map(docs.map(d => [d.artNr, d]));

        const items: (OrderEmailItem & { productId: string | null; mocCzk: number })[] = [];
        for (const [artNr, quantity] of merged) {
            const doc = byArt.get(artNr);
            if (!doc) {
                return NextResponse.json({ error: `Kolo ${artNr} už v akční nabídce není.` }, { status: 400 });
            }
            const pub = toPublicItem(doc, ordered.get(artNr) || 0, settings.eurCzk);
            if (quantity > pub.available) {
                const label = `${doc.brand} ${pub.model}${pub.size ? `, vel. ${pub.size}` : ''}`;
                return NextResponse.json(
                    { error: `${label}: k dispozici je už jen ${pub.available} ks — upravte množství.` },
                    { status: 400 },
                );
            }
            items.push({
                productId: doc.productId ?? null,
                variantId: artNr,
                quantity,
                brand: doc.brand,
                model: pub.model,
                year: doc.year ?? 0,
                color: doc.color ?? '',
                size: sizeLabel(doc) ?? '',
                // Firestore odmítá `undefined` — kapacitu přidat jen když existuje
                ...(doc.capacity ? { capacity: doc.capacity } : {}),
                unitPriceCzk: pub.vocCzk,
                mocCzk: pub.mocCzk,
            });
        }

        const totalCzk = items.reduce((s, i) => s + (i.unitPriceCzk || 0) * i.quantity, 0);
        const itemCount = items.reduce((s, i) => s + i.quantity, 0);
        const now = new Date().toISOString();

        // Pořadové číslo objednávky top001, top002, … — čítač v counters/topAkceOrders,
        // transakce zaručí, že dvě souběžné objednávky nedostanou stejné číslo.
        const counterRef = adminDb.collection('counters').doc('topAkceOrders');
        const orderId = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(counterRef);
            const next = (Number(snap.exists ? snap.get('last') : 0) || 0) + 1;
            const id = `top${String(next).padStart(3, '0')}`;
            tx.set(counterRef, { last: next, updatedAt: now }, { merge: true });
            tx.set(adminDb.collection('orders').doc(id), {
                status: 'new',
                source: TOP_AKCE_SOURCE,
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
                eurCzk: settings.eurCzk,
                items,
            });
            return id;
        });

        const emailData = {
            orderId,
            email: customer.email,
            companyName: customer.companyName,
            contactName: customer.contactName,
            phone: customer.phone,
            priceLevel: customer.priceLevel,
            note,
            items,
            totalCzk,
            source: TOP_AKCE_SOURCE,
        };
        after(() => Promise.allSettled([
            sendOrderNotifyToAdmin(emailData),
            sendOrderAck(emailData),
        ]));

        return NextResponse.json({ ok: true, orderId, totalCzk, itemCount });
    } catch (error) {
        console.error('top-akce order error:', error);
        return NextResponse.json({ error: 'Objednávku se nepodařilo odeslat.' }, { status: 500 });
    }
}
