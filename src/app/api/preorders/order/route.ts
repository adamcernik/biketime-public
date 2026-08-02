/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { rateLimit } from '@/lib/rateLimit';
import { sendPreorderNotifyToAdmin, sendPreorderAck, type PreorderEmailItem } from '@/lib/preorderEmail';

/**
 * Submits a dealer preorder. The order is validated against the curated
 * settings/preorders list (a dealer cannot order a product outside it),
 * persisted to the server-only `preorder_orders` collection, and announced
 * by e-mail to the operator + confirmed to the dealer (best-effort).
 */
export const dynamic = 'force-dynamic';

const MAX_LINES = 200;
const MAX_QTY = 99;
const MAX_NOTE = 2000;

export async function POST(request: Request) {
  const caller = await getVerifiedUser(request);
  if (!caller?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userSnap = await adminDb.collection('users').doc(caller.uid).get();
  const user = userSnap.exists ? (userSnap.data() as any) : null;
  if (!user || user.hasAccess !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!(await rateLimit(`preorder:${caller.uid}`, 10, 3600))) {
    return NextResponse.json({ error: 'Příliš mnoho předobjednávek, zkuste to prosím později.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, MAX_NOTE) : '';

  if (rawItems.length === 0) return NextResponse.json({ error: 'Objednávka je prázdná.' }, { status: 400 });
  if (rawItems.length > MAX_LINES) return NextResponse.json({ error: 'Příliš mnoho položek.' }, { status: 400 });

  // Only products the admin actually opened for preorder are orderable.
  const settingsSnap = await adminDb.collection('settings').doc('preorders').get();
  const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};
  if (settings?.enabled !== true) {
    return NextResponse.json({ error: 'Předobjednávky nejsou momentálně otevřené.' }, { status: 409 });
  }
  const season = typeof settings?.title === 'string' && settings.title.trim() ? settings.title.trim() : 'Předobjednávky 2027';
  const allowedIds = new Set<string>(Array.isArray(settings?.productIds) ? settings.productIds : []);

  // Merge duplicate lines, validate shapes.
  const wanted = new Map<string, { productId: string; variantId: string; quantity: number }>();
  for (const raw of rawItems) {
    const productId = typeof raw?.productId === 'string' ? raw.productId.trim() : '';
    const variantId = typeof raw?.variantId === 'string' ? raw.variantId.trim() : '';
    const quantity = Number(raw?.quantity);
    if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      return NextResponse.json({ error: 'Neplatná položka objednávky.' }, { status: 400 });
    }
    if (!allowedIds.has(productId)) {
      return NextResponse.json({ error: `Produkt ${productId} není v předobjednávkové nabídce.` }, { status: 400 });
    }
    const key = `${productId}|${variantId}`;
    const prev = wanted.get(key);
    wanted.set(key, { productId, variantId, quantity: Math.min(MAX_QTY, (prev?.quantity ?? 0) + quantity) });
  }

  // Resolve every line against the live catalog and snapshot the details.
  const productIds = [...new Set([...wanted.values()].map((w) => w.productId))];
  const productMap = new Map<string, any>();
  for (let i = 0; i < productIds.length; i += 100) {
    const refs = productIds.slice(i, i + 100).map((id) => adminDb.collection('products_v2').doc(id));
    const snaps = await adminDb.getAll(...refs);
    for (const snap of snaps) if (snap.exists) productMap.set(snap.id, snap.data());
  }

  const items: (PreorderEmailItem & { productId: string })[] = [];
  for (const line of wanted.values()) {
    const product = productMap.get(line.productId);
    const variant = Array.isArray(product?.variants)
      ? product.variants.find((v: any) => String(v?.id) === line.variantId)
      : null;
    if (!product || !variant) {
      return NextResponse.json({ error: `Varianta ${line.variantId} nebyla nalezena.` }, { status: 400 });
    }
    items.push({
      productId: line.productId,
      variantId: line.variantId,
      brand: product.brand || '',
      model: product.model || '',
      year: Number(product.year) || 0,
      color: variant.color || '',
      size: variant.size || '',
      frameShape: variant.frameShape || '',
      capacity: variant.capacity || '',
      quantity: line.quantity,
    });
  }

  const contactName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.displayName || '';
  const now = new Date();
  const orderRef = await adminDb.collection('preorder_orders').add({
    status: 'new',
    season,
    createdAt: now,
    updatedAt: now,
    uid: caller.uid,
    email: caller.email,
    customer: {
      companyName: user.companyName || '',
      contactName,
      phone: user.phone || '',
      priceLevel: user.priceLevel || '',
    },
    note,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    items,
  });

  const emailData = {
    orderId: orderRef.id,
    email: caller.email,
    companyName: user.companyName || '',
    contactName,
    phone: user.phone || '',
    note,
    season,
    items,
  };
  // Best-effort — the order is already saved.
  await Promise.all([sendPreorderNotifyToAdmin(emailData), sendPreorderAck(emailData)]);

  return NextResponse.json({ ok: true, orderId: orderRef.id });
}
