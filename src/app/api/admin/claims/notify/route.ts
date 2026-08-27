import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { ClaimStatus, sendClaimStatusToDealer } from '@/lib/claimEmail';

// Volá administrace po uložení změny stavu/poznámky reklamace: pošle
// partnerovi e-mail s aktuálním stavem. Route čte čerstvý dokument z
// Firestore — payloadu (kromě claimId) nevěří. Auth + CORS stejné jako
// send-approved-email.
export const dynamic = 'force-dynamic';

const ADMIN_ORIGIN = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';
const CORS = {
    'Access-Control-Allow-Origin': ADMIN_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

const VALID_STATUSES: ClaimStatus[] = ['new', 'in_progress', 'resolved', 'rejected'];

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
    const caller = await getVerifiedUser(request);
    if (!caller) return json({ error: 'Unauthorized' }, 401);

    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    const role = callerDoc.exists ? (callerDoc.data()?.role as string | undefined) : undefined;
    if (role !== 'admin' && role !== 'poweradmin') {
        return json({ error: 'Forbidden' }, 403);
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const claimId = typeof body.claimId === 'string' ? body.claimId : '';
    if (!claimId) return json({ error: 'Missing claimId' }, 400);

    try {
        const snap = await adminDb.collection('claims').doc(claimId).get();
        const data = snap.data();
        if (!snap.exists || !data) return json({ error: 'Claim not found' }, 404);

        const status = VALID_STATUSES.includes(data.status) ? (data.status as ClaimStatus) : 'new';
        const sent = await sendClaimStatusToDealer({
            claimId,
            email: String(data.email || ''),
            contactName: data.customer?.contactName ? String(data.customer.contactName) : undefined,
            frameNumber: String(data.frameNumber || ''),
            status,
            adminNote: data.adminNote ? String(data.adminNote) : undefined,
        });

        return json({ ok: sent });
    } catch (e) {
        console.error('admin claim notify error', e);
        return json({ error: 'E-mail se nepodařilo odeslat.' }, 500);
    }
}
