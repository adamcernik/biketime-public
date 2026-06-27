/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Public BULLS model series, served server-side via the Admin SDK so the browser
// never opens a direct client-side Firestore connection. No sensitive data.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snap = await adminDb.collection('bulls_models').get();
    const models = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    models.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    return NextResponse.json(
      { models },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('Bulls models API error:', error);
    return NextResponse.json({ models: [] }, { status: 200 });
  }
}
