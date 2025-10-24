import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface BikeFields {
  nrLf?: string;
  lfSn?: string;
  bild1?: string;
  specifications?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const ref = doc(db, 'bikes', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = snap.data() as Record<string, unknown>;
    const bike: BikeFields & { id: string; sizes?: string[]; capacitiesWh?: number[] } = { ...(data as BikeFields), id: snap.id };

    // Derive sizes for this model by finding same NRLF base among active bikes
    const nr = ((data.nrLf as string | undefined) ?? (data.lfSn as string | undefined) ?? '').toString();
    const m = nr.match(/^(.*?)(\d{2})$/);
    const base = m ? m[1] : nr;
    if (base) {
      const bikesRef = collection(db, 'bikes');
      const q = query(bikesRef, where('isActive', '==', true));
      const list = await getDocs(q);
      const sizes = Array.from(new Set(
        list.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(base))
          .map(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString().match(/(\d{2})$/)?.[1]))
          .filter(Boolean) as string[]
      )).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
      bike.sizes = sizes;

      // Also compute merged battery capacities for this family (third digit from right)
      const capacityCodeToWh: Record<string, number> = { '9': 900, '8': 800, '7': 750, '6': 600, '5': 500, '4': 400 };
      const family = (((data.nrLf as string | undefined) ?? (data.lfSn as string | undefined) ?? '').toString()).replace(/(\d{3})$/, '');
      const capacities = Array.from(new Set(
        list.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(family))
          .map(b => {
            const nr = (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString());
            const code = nr.charAt(Math.max(0, nr.length - 3));
            return capacityCodeToWh[code];
          })
          .filter(Boolean) as number[]
      )).sort((a, b) => a - b);
      if (capacities.length) bike.capacitiesWh = capacities;
    }

    return NextResponse.json(bike);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}



