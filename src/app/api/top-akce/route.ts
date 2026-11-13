import { NextRequest, NextResponse } from 'next/server';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { loadTopAkceOffer } from '@/lib/topAkce';

export const dynamic = 'force-dynamic';

/**
 * GET /api/top-akce — akční nabídka kol pro schválené obchodníky.
 * Vrací položky s dostupností a CZK cenami (VOC, UVP přepočtené kurzem,
 * akční MOC s DPH). Anonymní / neschválený uživatel → 401, nabídka
 * vypnutá v adminu → published: false a prázdný seznam.
 */
export async function GET(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { settings, items } = await loadTopAkceOffer();
        return NextResponse.json(
            { published: settings.published, intro: settings.intro, eurCzk: settings.eurCzk, items },
            { headers: { 'Cache-Control': 'private, no-store' } },
        );
    } catch (error) {
        console.error('top-akce GET error:', error);
        return NextResponse.json({ error: 'Nabídku se nepodařilo načíst.' }, { status: 500 });
    }
}
