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
    const nr = (searchParams.get('q') || '').trim();
    if (!nr) return NextResponse.json({ error: 'Missing q (NRLF or doc id)' }, { status: 400 });

    const bikesCol = adminDb.collection('bikes');
    let bikeSnap = await bikesCol.doc(nr).get();

    if (!bikeSnap.exists) {
      const found = await bikesCol.where('nrLf', '==', nr).limit(1).get();
      if (!found.empty) {
        bikeSnap = found.docs[0]!;
      } else {
        const byLfSn = await bikesCol.where('lfSn', '==', nr).limit(1).get();
        if (!byLfSn.empty) bikeSnap = byLfSn.docs[0]!;
      }
    }

    if (!bikeSnap.exists) return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    const bikeData = bikeSnap.data()!;

    const nrVal = (bikeData.nrLf ?? bikeData.lfSn ?? '').toString();
    const family = nrVal.match(/^(.*?)(\d{3})$/)?.[1] || nrVal;

    // Family docs
    const list = await bikesCol.where('isActive', '==', true).get();
    const familyDocs = list.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((b: any) => (b.nrLf ?? b.lfSn ?? '').toString().startsWith(family));

    const toNum = (v: any) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const n = Number(String(v || '0').replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const familyStock = familyDocs.map((b: any) => {
      const n = (b.nrLf ?? b.lfSn ?? '').toString();
      const b2b = toNum(b.b2bStockQuantity ?? 0);
      return { id: b.id, nrLf: n, b2bStockQuantity: b2b };
    });

    const stockDocs = await adminDb.collection('stock').get();
    const ourStock = stockDocs.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((s: any) => {
        const key = (s.nrLf ?? s.nrlf ?? s.id ?? '').toString();
        return key === nr || key.startsWith(family) || key === nrVal;
      })
      .map((s: any) => ({
        id: s.id,
        key: (s.nrLf ?? s.nrlf ?? s.id ?? '').toString(),
        stock: toNum(s.stock ?? s.qty ?? s.onHand ?? 0),
        inTransit: toNum(s.inTransit ?? s.in_transit ?? s.incoming ?? 0)
      }));

    return NextResponse.json({
      query: nr,
      resolvedId: bikeSnap.id,
      nrLf: nrVal,
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
