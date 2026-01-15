import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type AllowedUpdates = Partial<{
  productType: string;
  categorie: string;
  modelljahr: number | null;
  uvpPl: number | null;
  ekPl: number | null;
  uavpPl: number | null;
}>;

export async function POST(req: NextRequest) {
  // 1. Authenticate using API Key
  const authHeader = req.headers.get('authorization');
  if (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
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
  await adminDb.collection('accessories').doc(id).update({
    ...clean,
    updatedAt: Date.now(),
  });
  return NextResponse.json({ ok: true, id, updatedKeys: Object.keys(clean) });
}


