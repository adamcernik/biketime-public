import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const docRef = doc(db, 'products_v2', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const product = { id: snapshot.id, ...snapshot.data() };
        return NextResponse.json(product);

    } catch (error) {
        console.error('Catalog V2 Detail Error:', error);
        return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
    }
}
