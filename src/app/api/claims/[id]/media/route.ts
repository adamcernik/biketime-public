import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { presignGetUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/claims/[id]/media
 *
 * Ověří partnera a vlastnictví reklamace, pak vydá krátkodobé podepsané
 * odkazy (15 min) na přílohy v R2. Žádné dlouhověké URL.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const customer = await getApprovedCustomer(request);
    if (!customer) {
        return NextResponse.json({ error: 'Přihlášení je vyžadováno.' }, { status: 401 });
    }

    const { id } = await params;
    try {
        const snap = await adminDb.collection('claims').doc(id).get();
        const data = snap.data();
        // 404 i pro cizí reklamace — neprozrazujeme, že dokument existuje.
        if (!snap.exists || !data || data.uid !== customer.uid) {
            return NextResponse.json({ error: 'Reklamace nenalezena.' }, { status: 404 });
        }

        const media: { key: string; fileName?: string; contentType?: string }[] =
            Array.isArray(data.media) ? data.media : [];
        const urls = await Promise.all(media.map(async m => ({
            key: m.key,
            fileName: m.fileName || 'soubor',
            contentType: m.contentType || '',
            url: await presignGetUrl(m.key, 900),
        })));

        return NextResponse.json({ urls }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (e) {
        console.error('claim media error', e);
        return NextResponse.json({ error: 'Odkazy se nepodařilo vytvořit.' }, { status: 500 });
    }
}
