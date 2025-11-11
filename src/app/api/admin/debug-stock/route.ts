import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const nr = (searchParams.get('q') || '').trim();
    if (!nr) return NextResponse.json({ error: 'Missing q (NRLF or doc id)' }, { status: 400 });

    // Resolve by doc id first
    let bikeSnap = await getDoc(doc(db, 'bikes', nr));
    let bikeData: Record<string, unknown> | null = null;
    if (!bikeSnap.exists()) {
      // Try by nrLf
      const found = await getDocs(query(collection(db, 'bikes'), where('nrLf', '==', nr)));
      if (!found.empty) {
        bikeSnap = found.docs[0]!;
      } else {
        const byLfSn = await getDocs(query(collection(db, 'bikes'), where('lfSn', '==', nr)));
        if (!byLfSn.empty) bikeSnap = byLfSn.docs[0]!;
      }
    }
    if (bikeSnap.exists()) bikeData = bikeSnap.data() as Record<string, unknown>;
    if (!bikeData) return NextResponse.json({ error: 'Bike not found' }, { status: 404 });

    const nrVal = ((bikeData.nrLf as string | undefined) ?? (bikeData.lfSn as string | undefined) ?? '').toString();
    const m2 = nrVal.match(/^(.*?)(\d{2})$/);
    const base2 = m2 ? m2[1] : nrVal;
    const m3 = nrVal.match(/^(.*?)(\d{3})$/);
    const family = m3 ? m3[1] : nrVal;

    // Gather family docs
    const list = await getDocs(query(collection(db, 'bikes'), where('isActive', '==', true)));
    const familyDocs = list.docs
      .map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter(b => ((((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString())).startsWith(family));
    const familyStock = familyDocs.map(b => {
      const n = (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString());
      const size = n.match(/(\\d{2})$/)?.[1] ?? '';
      const b2b = Number((b as any).b2bStockQuantity ?? 0) || 0;
      return { id: b.id as string, nrLf: n, size, b2bStockQuantity: b2b };
    });

    // Our stock document(s)
    const stockDocs = await getDocs(collection(db, 'stock'));
    const ourStock = stockDocs.docs
      .map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter(s => {
        const key = ((s as any).nrLf ?? (s as any).nrlf ?? s.id ?? '').toString();
        return key === nr || key.startsWith(family) || key === nrVal;
      })
      .map(s => {
        const key = ((s as any).nrLf ?? (s as any).nrlf ?? s.id ?? '').toString();
        const stock = Number((s as any).stock ?? (s as any).qty ?? (s as any).onHand ?? 0) || 0;
        const inTransit = Number((s as any).inTransit ?? (s as any).in_transit ?? (s as any).incoming ?? 0) || 0;
        return { id: s.id as string, key, stock, inTransit };
      });

    return NextResponse.json({
      query: nr,
      resolvedId: bikeSnap.id,
      nrLf: nrVal,
      base2,
      family,
      familyCount: familyDocs.length,
      familyStock,
      ourStock,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


