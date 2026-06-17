import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';
import { stripSensitiveFields } from '@/lib/apiSanitize';
import { hasValidAccessoryPrice } from '@/lib/accessoryPrice';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const snap = await getDoc(doc(db, 'accessories', id));
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data = snap.data() as Record<string, unknown>;
    // Accessories without a real ceník price are not shown publicly.
    if (!hasValidAccessoryPrice(data as { mocCzk?: number | null; priceLevelsCzk?: { A?: number | null; B?: number | null } })) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(stripSensitiveFields({ id: snap.id, ...data }), {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}


