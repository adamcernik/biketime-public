import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { sendApprovalEmail } from '@/lib/registrationEmail';

// Called by the admin dashboard (b2b.biketime.cz) right after it grants a shop
// user access. Sends the "you're approved" e-mail to that user. Secured: the
// caller must be an admin/poweradmin (verified Firebase ID token → role checked
// via adminDb); both apps share the same Firebase project so the admin's token
// validates here. Cross-origin from the admin app → CORS allowed below.
export const dynamic = 'force-dynamic';

const ADMIN_ORIGIN = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';
const CORS = {
  'Access-Control-Allow-Origin': ADMIN_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

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
  const uid = typeof body.uid === 'string' ? body.uid : '';
  if (!uid) return json({ error: 'Missing uid' }, 400);

  const targetRef = adminDb.collection('users').doc(uid);
  const target = await targetRef.get();
  if (!target.exists) return json({ error: 'User not found' }, 404);
  const t = target.data() || {};

  // Only mail people who are actually approved, and only once.
  if (!t.hasAccess) return json({ error: 'User not approved' }, 409);
  if (t.approvalEmailSentAt) return json({ ok: true, already: true });

  const name = (t.firstName as string) || (t.displayName as string) || undefined;
  const sent = await sendApprovalEmail(t.email as string, name);
  if (sent) await targetRef.update({ approvalEmailSentAt: new Date().toISOString() });

  return json({ ok: sent });
}
