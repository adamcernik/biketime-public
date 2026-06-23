import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';
import { stripSensitiveFields, stripB2BPrices } from '@/lib/apiSanitize';
import { hasValidAccessoryPrice } from '@/lib/accessoryPrice';
import { isAuthenticatedRequest } from '@/lib/userAuth';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const b2b = await isAuthenticatedRequest(req);
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
    const safe = stripSensitiveFields({ id: snap.id, ...data });
    return NextResponse.json(b2b ? safe : stripB2BPrices(safe), {
      headers: { 'Cache-Control': b2b ? 'private, no-store' : 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}


