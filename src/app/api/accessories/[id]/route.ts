import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const snap = await getDoc(doc(db, 'accessories', id));
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data = snap.data() as Record<string, unknown>;
    return NextResponse.json({ id: snap.id, ...data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}


