/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// TEMPORARY debug endpoint — surfaces why dealer-price auth gating decides as it
// does. Remove before keeping in production.
export async function GET(req: NextRequest) {
  const out: any = {};
  const h = req.headers.get('authorization') || '';
  out.hasHeader = !!h;
  const t = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  out.tokenLen = t.length;
  try {
    const dec = await adminAuth.verifyIdToken(t);
    out.uid = dec.uid;
    out.aud = dec.aud;
    const snap = await adminDb.collection('users').doc(dec.uid).get();
    out.exists = snap.exists;
    out.hasAccess = snap.data()?.hasAccess === true;
  } catch (e: any) {
    out.error = String(e?.message || e);
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
