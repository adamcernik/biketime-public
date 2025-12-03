import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export async function GET() {
    try {
        const q = query(collection(db, 'products_v2'), limit(5));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
