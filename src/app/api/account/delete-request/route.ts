import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { rateLimit } from '@/lib/rateLimit';
import { sendDeletionRequestToAdmin } from '@/lib/accountEmail';

export const dynamic = 'force-dynamic';

/**
 * Žádost o zrušení účtu. Účet nemažeme automaticky (vazby na objednávky,
 * faktury) — zapíšeme žádost na uživatele a operátor ji vyřídí ručně.
 */
export async function POST(request: NextRequest) {
    try {
        const caller = await getVerifiedUser(request);
        if (!caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!(await rateLimit(`delete-request:${caller.uid}`, 3, 86400))) {
            return NextResponse.json({ error: 'Žádost už byla odeslána.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';

        const userRef = adminDb.collection('users').doc(caller.uid);
        const userSnap = await userRef.get();
        const u = (userSnap.exists ? userSnap.data() : {}) as Record<string, unknown>;

        await userRef.set({
            deletionRequestedAt: new Date().toISOString(),
            deletionReason: reason || null,
        }, { merge: true });

        void sendDeletionRequestToAdmin({
            uid: caller.uid,
            email: caller.email || String(u.email || ''),
            companyName: typeof u.companyName === 'string' ? u.companyName : undefined,
            contactName: [u.firstName, u.lastName].filter(Boolean).join(' ') || undefined,
            reason,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Delete request error:', error);
        return NextResponse.json({ error: 'Žádost se nepodařilo odeslat.' }, { status: 500 });
    }
}
