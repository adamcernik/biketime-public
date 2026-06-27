/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Public shops list, served server-side via the Admin SDK so the browser never
// opens a direct client-side Firestore connection (which strict privacy browsers
// block). Returns full shop docs (no sensitive data — names/addresses/coords/links)
// so the map and listing have lat/lng/order.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snap = await adminDb.collection('shops').get();
    const shops = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    shops.sort((a: any, b: any) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
    return NextResponse.json(
      { shops },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('Shops API error:', error);
    return NextResponse.json({ shops: [] }, { status: 200 });
  }
}


