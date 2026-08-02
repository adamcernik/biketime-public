/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { stripSensitiveFields } from '@/lib/apiSanitize';

/**
 * Preorder catalog — the curated list of bikes open for preorder.
 * The set of products is an admin-maintained id list in `settings/preorders`
 * ({ enabled, title, productIds }), so it can mix preorder-only 2027 bikes
 * with selected models from earlier years.
 *
 * Dealer-only: requires a valid Firebase ID token AND an approved shop
 * account (users/{uid}.hasAccess).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const caller = await getVerifiedUser(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userSnap = await adminDb.collection('users').doc(caller.uid).get();
  if (!userSnap.exists || userSnap.data()?.hasAccess !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settingsSnap = await adminDb.collection('settings').doc('preorders').get();
  const settings = settingsSnap.exists ? (settingsSnap.data() as any) : {};
  const enabled = settings?.enabled === true;
  const title = typeof settings?.title === 'string' && settings.title.trim() ? settings.title.trim() : 'Předobjednávky 2027';
  const productIds: string[] = Array.isArray(settings?.productIds)
    ? settings.productIds.filter((id: unknown) => typeof id === 'string' && id.trim())
    : [];

  if (!enabled || productIds.length === 0) {
    return NextResponse.json(
      { enabled: false, title, products: [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const products: any[] = [];
  for (let i = 0; i < productIds.length; i += 100) {
    const refs = productIds.slice(i, i + 100).map((id) => adminDb.collection('products_v2').doc(id));
    const snaps = await adminDb.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() as any;
      const variants = Array.isArray(data.variants) ? data.variants : [];
      products.push({
        id: snap.id,
        ...data,
        colors: [...new Set(variants.map((v: any) => v?.color).filter(Boolean))],
      });
    }
  }

  // Keep the admin's curated order.
  const orderIndex = new Map(productIds.map((id, i) => [id, i]));
  products.sort((a, b) => (orderIndex.get(a.id) ?? 9999) - (orderIndex.get(b.id) ?? 9999));

  return NextResponse.json(
    { enabled: true, title, products: stripSensitiveFields(products) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
