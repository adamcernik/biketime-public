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
    if (!qParam) {
      return NextResponse.json({ error: 'Missing q param (doc id, nrLf or lfSn)' }, { status: 400 });
    }
    const bikesRef = collection(db, 'bikes');
    let targetId: string | null = null;
    // Try by document ID
    const byId = await getDoc(doc(db, 'bikes', qParam));
    if (byId.exists()) {
      targetId = byId.id;
    } else {
      // Try by nrLf
      const byNr = await getDocs(query(bikesRef, where('nrLf', '==', qParam)));
      if (!byNr.empty) {
        targetId = byNr.docs[0]!.id;
      } else {
        // Try by lfSn
        const byLf = await getDocs(query(bikesRef, where('lfSn', '==', qParam)));
        if (!byLf.empty) {
          targetId = byLf.docs[0]!.id;
        }
      }
    }
    if (!targetId) {
      return NextResponse.json({ error: 'Bike not found', q: qParam }, { status: 404 });
    }
    const ref = doc(db, 'bikes', targetId);
    const snap = await getDoc(ref);
    const data = snap.data() as Record<string, unknown> | undefined;
    if (!data) {
      return NextResponse.json({ error: 'Bike data not found', id: targetId }, { status: 404 });
    }
    const specs = ((data.specifications ?? {}) as Record<string, unknown>);
    const newSpecs = { ...specs, 'Antriebsart (MOTO)': 'elektro' };
    await updateDoc(ref, { specifications: newSpecs });
    return NextResponse.json({ ok: true, id: targetId, updated: { 'specifications.Antriebsart (MOTO)': 'elektro' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}


