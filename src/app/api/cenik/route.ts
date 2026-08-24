import { NextRequest, NextResponse } from 'next/server';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { buildCenik } from '@/lib/cenik/buildCenik';

export const dynamic = 'force-dynamic';

/** Dealerský ceník pro přihlášeného partnera — jen jeho cenová hladina. */
export async function GET(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await buildCenik(customer.priceLevel);
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('Cenik error:', error);
        return NextResponse.json({ error: 'Ceník se nepodařilo načíst.' }, { status: 500 });
    }
}
