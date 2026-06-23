import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';
import { stripSensitiveFields, stripB2BPrices } from '@/lib/apiSanitize';
import { isApprovedShopRequest } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const b2b = await isApprovedShopRequest(req);
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
        const safe = stripSensitiveFields(product);
        return NextResponse.json(b2b ? safe : stripB2BPrices(safe), {
            headers: { 'Cache-Control': b2b ? 'private, no-store' : 'public, s-maxage=300, stale-while-revalidate=600' }
        });

    } catch (error) {
        console.error('Catalog V2 Detail Error:', error);
        return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
    }
}
