import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { rateLimit } from '@/lib/rateLimit';
import { extForContentType, isAllowedClaimType, maxBytesForType, presignPutUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Vydá presigned PUT pro přímý upload přílohy reklamace do R2. Prohlížeč
// nahrává rovnou do bucketu (videa by neprošla Vercel limitem na body);
// klíč patří vždy do prefixu přihlášeného partnera.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await rateLimit(`claim-upload:${customer.uid}`, 60, 3600))) {
            return NextResponse.json({ error: 'Příliš mnoho nahrávání, zkuste to později.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const draftId = typeof body?.draftId === 'string' ? body.draftId : '';
        const contentType = typeof body?.contentType === 'string' ? body.contentType.toLowerCase() : '';
        const size = Number(body?.size);

        if (!UUID_RE.test(draftId)) {
            return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 });
        }
        if (!isAllowedClaimType(contentType)) {
            return NextResponse.json({ error: 'Nepodporovaný typ souboru. Nahrajte fotku (JPG, PNG, WebP, HEIC) nebo video (MP4, MOV).' }, { status: 400 });
        }
        if (!Number.isFinite(size) || size <= 0 || size > maxBytesForType(contentType)) {
            const limitMb = Math.round(maxBytesForType(contentType) / 1024 / 1024);
            return NextResponse.json({ error: `Soubor je příliš velký (limit ${limitMb} MB).` }, { status: 400 });
        }

        const ext = extForContentType(contentType);
        const key = `claims/${customer.uid}/${draftId.toLowerCase()}/${randomUUID()}.${ext}`;
        const url = await presignPutUrl(key, contentType, 600);

        return NextResponse.json({ key, url }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
        console.error('Claim upload-url error:', error);
        return NextResponse.json({ error: 'Nahrávání se nepodařilo připravit.' }, { status: 500 });
    }
}
