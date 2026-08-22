import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';

export const dynamic = 'force-dynamic';

/** Vlastní předobjednávky partnera (kolekce preorder_orders). */
export async function GET(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snap = await adminDb.collection('preorder_orders')
            .where('uid', '==', customer.uid)
            .limit(200)
            .get();

        const toIso = (v: unknown): string => {
            if (!v) return '';
            if (typeof v === 'string') return v;
            if (typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate().toISOString();
            if (v instanceof Date) return v.toISOString();
            return '';
        };

        const preorders = snap.docs
            .map(d => {
                const data = d.data();
                return { id: d.id, ...data, createdAt: toIso(data.createdAt), updatedAt: toIso(data.updatedAt) };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        return NextResponse.json({ preorders }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
        console.error('Preorders list error:', error);
        return NextResponse.json({ error: 'Předobjednávky se nepodařilo načíst.' }, { status: 500 });
    }
}
