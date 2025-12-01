import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docRef = doc(db, 'products_v2', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const productData = snapshot.data();
        
        // Ensure variants have nrLf or fallback to ID if possible?
        // In products_v2, variants usually look like { id: '...', size: '...', nrLf: '...' }
        // If nrLf is missing in variant, we might need to ensure it is passed if available.
        // Let's check the data structure.
        
        const product = { id: snapshot.id, ...productData };
        return NextResponse.json(product);

    } catch (error) {
        console.error('Catalog V2 Detail Error:', error);
        return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
    }
}
