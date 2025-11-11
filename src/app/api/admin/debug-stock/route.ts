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
    type BikeDoc = { id: string; nrLf?: string; lfSn?: string; b2bStockQuantity?: number | string };
    const list = await getDocs(query(collection(db, 'bikes'), where('isActive', '==', true)));
    const familyDocs: BikeDoc[] = list.docs
      .map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as BikeDoc))
      .filter((b: BikeDoc) => ((((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString())).startsWith(family));
    const toNum = (v: unknown): number => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v ?? '').replace(/[^0-9.-]/g, '');
      const n = Number(s || '0');
      return Number.isFinite(n) ? n : 0;
    };
    const familyStock = familyDocs.map((b: BikeDoc) => {
      const n = (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString());
      const size = n.match(/(\\d{2})$/)?.[1] ?? '';
      const b2b = toNum(b.b2bStockQuantity ?? 0);
      return { id: b.id as string, nrLf: n, size, b2bStockQuantity: b2b };
    });

    // Our stock document(s)
    const stockDocs = await getDocs(collection(db, 'stock'));
    type StockRow = {
      id: string;
      nrLf?: string;
      nrlf?: string;
      stock?: number | string;
      qty?: number | string;
      onHand?: number | string;
      inTransit?: number | string;
      in_transit?: number | string;
      incoming?: number | string;
    };
    const rows: StockRow[] = stockDocs.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as StockRow));
    const ourStock = rows
      .filter((s: StockRow) => {
        const key = (s.nrLf ?? s.nrlf ?? s.id ?? '').toString();
        return key === nr || key.startsWith(family) || key === nrVal;
      })
      .map((s: StockRow) => {
        const key = (s.nrLf ?? s.nrlf ?? s.id ?? '').toString();
        const stock = toNum(s.stock ?? s.qty ?? s.onHand ?? 0);
        const inTransit = toNum(s.inTransit ?? s.in_transit ?? s.incoming ?? 0);
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


