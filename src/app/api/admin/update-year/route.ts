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
    const yearParam = Number(searchParams.get('year') || '');
    if (!qParam) return NextResponse.json({ error: 'Missing q (doc id, nrLf or lfSn)' }, { status: 400 });
    if (!Number.isFinite(yearParam) || yearParam <= 0) return NextResponse.json({ error: 'Invalid year' }, { status: 400 });

    const bikesRef = adminDb.collection('bikes');
    let targetId: string | null = null;

    // by document ID
    const byId = await bikesRef.doc(qParam).get();
    if (byId.exists) {
      targetId = byId.id;
    } else {
      // by nrLf
      const byNr = await bikesRef.where('nrLf', '==', qParam).get();
      if (!byNr.empty) {
        targetId = byNr.docs[0]!.id;
      } else {
        // by lfSn
        const byLf = await bikesRef.where('lfSn', '==', qParam).get();
        if (!byLf.empty) {
          targetId = byLf.docs[0]!.id;
        }
      }
    }
    if (!targetId) return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    await bikesRef.doc(targetId).update({ modelljahr: yearParam });
    return NextResponse.json({ ok: true, id: targetId, modelljahr: yearParam });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
