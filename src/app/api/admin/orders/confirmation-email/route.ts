import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { sendOrderConfirmation, type ConfirmedOrderDoc } from '@/lib/orderEmail';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/orders/confirmation-email  { orderId }
 *
 * Volá administrace (b2b.biketime.cz, server → server s ADMIN_API_KEY) po
 * potvrzení objednávky s reálnými kusy. Přečte objednávku z Firestore,
 * pošle partnerovi potvrzení (Resend) a zapíše `confirmationEmailSentAt`.
 * Potvrzené kusy se tu nepočítají ani nemění — zdrojem je uložená objednávka.
 */
export async function POST(request: NextRequest) {
    if (!isAdminAuthorized(request)) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(orderId)) {
        return NextResponse.json({ ok: false, error: 'Neplatné číslo objednávky' }, { status: 400 });
    }

    const ref = adminDb.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Objednávka neexistuje' }, { status: 404 });
    const order = { id: orderId, ...(snap.data() as Omit<ConfirmedOrderDoc, 'id'>) };
    if (!order.confirmedAt) {
        return NextResponse.json({ ok: false, error: 'Objednávka ještě není potvrzená' }, { status: 400 });
    }
    if (!order.email) return NextResponse.json({ ok: false, error: 'Objednávka nemá e-mail partnera' }, { status: 400 });

    const result = await sendOrderConfirmation(order);
    if (!result.ok) {
        await ref.update({ confirmationEmailError: result.error }).catch(() => undefined);
        return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    const sentAt = new Date().toISOString();
    await ref.update({ confirmationEmailSentAt: sentAt, confirmationEmailError: null });
    return NextResponse.json({ ok: true, sentAt }, { headers: { 'Cache-Control': 'private, no-store' } });
}
