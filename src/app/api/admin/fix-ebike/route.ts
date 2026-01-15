import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  // 1. Authenticate using API Key
  const authHeader = req.headers.get('authorization');
  if (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const qParam = (searchParams.get('q') || '').trim();
    if (!qParam) {
      return NextResponse.json({ error: 'Missing q param (doc id, nrLf or lfSn)' }, { status: 400 });
    }
    const bikesRef = adminDb.collection('bikes');
    let targetId: string | null = null;

    // Try by document ID
    const byId = await bikesRef.doc(qParam).get();
    if (byId.exists) {
      targetId = byId.id;
    } else {
      // Try by nrLf
      const byNr = await bikesRef.where('nrLf', '==', qParam).get();
      if (!byNr.empty) {
        targetId = byNr.docs[0]!.id;
      } else {
        // Try by lfSn
        const byLf = await bikesRef.where('lfSn', '==', qParam).get();
        if (!byLf.empty) {
          targetId = byLf.docs[0]!.id;
        }
      }
    }
    if (!targetId) {
      return NextResponse.json({ error: 'Bike not found', q: qParam }, { status: 404 });
    }

    const snap = await bikesRef.doc(targetId).get();
    const data = snap.data();
    if (!data) {
      return NextResponse.json({ error: 'Bike data not found', id: targetId }, { status: 404 });
    }

    const specs = (data.specifications ?? {}) as Record<string, unknown>;
    const newSpecs = { ...specs, 'Antriebsart (MOTO)': 'elektro' };
    await bikesRef.doc(targetId).update({ specifications: newSpecs });

    return NextResponse.json({ ok: true, id: targetId, updated: { 'specifications.Antriebsart (MOTO)': 'elektro' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
