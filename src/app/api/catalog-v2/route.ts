import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '24');
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const year = searchParams.get('year');

        let q = collection(db, 'products_v2');
        let constraints: any[] = [];

        // Basic filtering
        // Note: Composite indexes might be needed for multiple where clauses + orderBy
        // For now, we'll do basic filtering in memory if needed, or simple queries.
        // Given the small dataset (103 products), in-memory filtering is actually faster and safer/cheaper.

        const snapshot = await getDocs(q);
        let products = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // In-memory filtering
        if (category) {
            products = products.filter(p => p.category === category);
        }
        if (brand) {
            products = products.filter(p => p.brand === brand);
        }
        if (year) {
            products = products.filter(p => p.year === parseInt(year));
        }

        // Sort by Year (desc), then Brand, then Model
        products.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
            return a.model.localeCompare(b.model);
        });

        // Pagination
        const total = products.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const paginatedProducts = products.slice(start, start + pageSize);

        // Extract filters for UI
        const categories = Array.from(new Set(products.map(p => p.category))).sort();
        const brands = Array.from(new Set(products.map(p => p.brand))).sort();
        const years = Array.from(new Set(products.map(p => p.year))).sort((a: any, b: any) => b - a);

        return NextResponse.json({
            products: paginatedProducts,
            pagination: {
                total,
                page,
                pageSize,
                totalPages
            },
            filters: {
                categories,
                brands,
                years
            }
        });

    } catch (error) {
        console.error('Catalog V2 Error:', error);
        return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
}
