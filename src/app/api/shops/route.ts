import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export async function GET() {
  try {
    const q = query(collection(db, 'shops'));
    const snap = await getDocs(q);
    const shops = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ shops });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ shops: [] }, { status: 500 });
  }
}


