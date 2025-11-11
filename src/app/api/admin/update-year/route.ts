import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const qParam = (searchParams.get('q') || '').trim();
    const yearParam = Number(searchParams.get('year') || '');
    if (!qParam) return NextResponse.json({ error: 'Missing q (doc id, nrLf or lfSn)' }, { status: 400 });
    if (!Number.isFinite(yearParam) || yearParam <= 0) return NextResponse.json({ error: 'Invalid year' }, { status: 400 });

    const bikesRef = collection(db, 'bikes');
    let targetId: string | null = null;
    // by document ID
    const byId = await getDoc(doc(db, 'bikes', qParam));
    if (byId.exists()) {
      targetId = byId.id;
    } else {
      // by nrLf
      const byNr = await getDocs(query(bikesRef, where('nrLf', '==', qParam)));
      if (!byNr.empty) {
        targetId = byNr.docs[0]!.id;
      } else {
        // by lfSn
        const byLf = await getDocs(query(bikesRef, where('lfSn', '==', qParam)));
        if (!byLf.empty) {
          targetId = byLf.docs[0]!.id;
        }
      }
    }
    if (!targetId) return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    await updateDoc(doc(db, 'bikes', targetId), { modelljahr: yearParam });
    return NextResponse.json({ ok: true, id: targetId, modelljahr: yearParam });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}


