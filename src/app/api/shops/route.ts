import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query } from 'firebase/firestore';

type Shop = {
  name: string;
  address: string;
  website?: string;
};

export async function GET() {
  try {
    const q = query(collection(db, 'shops'));
    const snap = await getDocs(q);
    const shops = snap.docs.map((d) => {
      const data = d.data() as Partial<Shop>;
      return {
        id: d.id,
        name: String(data.name ?? ''),
        address: String(data.address ?? ''),
        website: data.website ? String(data.website) : undefined,
      };
    });
    return NextResponse.json({ shops });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ shops: [] }, { status: 500 });
  }
}


