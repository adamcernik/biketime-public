import { NextRequest, NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { rateLimit } from '@/lib/rateLimit';
import { sendClaimAck, sendClaimNotifyToAdmin } from '@/lib/claimEmail';
import { isAllowedClaimType, maxBytesForType, MAX_CLAIM_FILES } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Reklamace / servisní případy partnerů. Přílohy jsou v tuto chvíli už
// nahrané v R2 (presigned PUT) — tady se jen ověří, že klíče patří do
// prefixu přihlášeného partnera, a uloží se dokument.

const MAX_FRAME_NUMBER = 100;
const MAX_DESCRIPTION = 5000;
const MAX_FILE_NAME = 200;

interface ClaimMediaInput {
    key: string;
    fileName: string;
    contentType: string;
    size: number;
}

export async function POST(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await rateLimit(`claim:${customer.uid}`, 5, 3600))) {
            return NextResponse.json({ error: 'Příliš mnoho reklamací, zkuste to později.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const frameNumber = typeof body?.frameNumber === 'string' ? body.frameNumber.trim().slice(0, MAX_FRAME_NUMBER) : '';
        const description = typeof body?.description === 'string' ? body.description.trim().slice(0, MAX_DESCRIPTION) : '';
        const rawMedia: unknown = body?.media ?? [];

        if (!frameNumber) {
            return NextResponse.json({ error: 'Vyplňte rámové číslo nebo BikeID.' }, { status: 400 });
        }
        if (!description) {
            return NextResponse.json({ error: 'Popište prosím závadu.' }, { status: 400 });
        }
        if (!Array.isArray(rawMedia) || rawMedia.length > MAX_CLAIM_FILES) {
            return NextResponse.json({ error: `Příloh může být nejvýše ${MAX_CLAIM_FILES}.` }, { status: 400 });
        }

        const keyPrefix = `claims/${customer.uid}/`;
        const media: ClaimMediaInput[] = [];
        for (const raw of rawMedia) {
            const key = typeof raw?.key === 'string' ? raw.key : '';
            const contentType = typeof raw?.contentType === 'string' ? raw.contentType.toLowerCase() : '';
            const size = Number(raw?.size);
            const fileName = (typeof raw?.fileName === 'string' ? raw.fileName : '').slice(0, MAX_FILE_NAME) || 'soubor';
            // Klíč musí pocházet z /api/claims/upload-url tohoto partnera —
            // cizí či podvržený prefix odmítáme.
            if (!key.startsWith(keyPrefix) || key.includes('..')
                || !isAllowedClaimType(contentType)
                || !Number.isFinite(size) || size <= 0 || size > maxBytesForType(contentType)) {
                return NextResponse.json({ error: 'Neplatná příloha.' }, { status: 400 });
            }
            media.push({ key, fileName, contentType, size });
        }

        const now = new Date().toISOString();
        const claimRef = await adminDb.collection('claims').add({
            status: 'new',
            createdAt: now,
            updatedAt: now,
            uid: customer.uid,
            email: customer.email,
            customer: {
                companyName: customer.companyName,
                contactName: customer.contactName,
                phone: customer.phone,
            },
            frameNumber,
            description,
            media,
            adminNote: '',
            statusHistory: [{ status: 'new', at: now }],
        });

        // E-maily best-effort — reklamace už je uložená
        const emailData = {
            claimId: claimRef.id,
            email: customer.email,
            companyName: customer.companyName,
            contactName: customer.contactName,
            phone: customer.phone,
            frameNumber,
            description,
            mediaCount: media.length,
        };
        // after(): odešle se garantovaně po odeslání odpovědi — pouhé
        // void Promise na Vercelu často neproběhlo (funkce se zmrazila)
        after(() => Promise.allSettled([
            sendClaimNotifyToAdmin(emailData),
            sendClaimAck(emailData),
        ]));

        return NextResponse.json({ ok: true, claimId: claimRef.id });
    } catch (error) {
        console.error('Claim create error:', error);
        return NextResponse.json({ error: 'Reklamaci se nepodařilo odeslat.' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Bez orderBy (žádný composite index) — řadíme v paměti, případů
        // na partnera jsou jednotky.
        const snap = await adminDb.collection('claims')
            .where('uid', '==', customer.uid)
            .limit(200)
            .get();

        const claims = snap.docs
            .map(d => ({ id: d.id, ...d.data() } as { id: string; createdAt?: string }))
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

        return NextResponse.json({ claims }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('Claim list error:', error);
        return NextResponse.json({ error: 'Reklamace se nepodařilo načíst.' }, { status: 500 });
    }
}
