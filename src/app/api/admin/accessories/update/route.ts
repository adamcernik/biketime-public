import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, updateDoc } from 'firebase/firestore';

type AllowedUpdates = Partial<{
  productType: string;
  categorie: string;
  modelljahr: number | null;
  uvpPl: number | null;
  ekPl: number | null;
  uavpPl: number | null;
}>;

export async function POST(req: NextRequest) {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { id?: string; updates?: AllowedUpdates } | null;
  if (!body || !body.id || !body.updates) {
    return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
  }
  const { id, updates } = body;
  const allowedKeys: Array<keyof AllowedUpdates> = ['productType', 'categorie', 'modelljahr', 'uvpPl', 'ekPl', 'uavpPl'];
  const clean: AllowedUpdates = {};
  for (const k of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(updates, k)) {
      // @ts-expect-error index
      clean[k] = updates[k];
    }
  }
  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  await updateDoc(doc(db, 'accessories', id), {
    ...clean,
    updatedAt: Date.now(),
  });
  return NextResponse.json({ ok: true, id, updatedKeys: Object.keys(clean) });
}


