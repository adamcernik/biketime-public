import { NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/userAuth';
import { sendRegistrationAck } from '@/lib/registrationEmail';

// Sends the "we're processing your registration" e-mail. Secured: the recipient
// is taken from the verified Firebase ID token, never from the request body, so
// it can only ever e-mail the authenticated user's own address.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getVerifiedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.email) return NextResponse.json({ error: 'No email on account' }, { status: 400 });

  // Optional display name from the body (e.g. firstName from the shop form);
  // falls back to the token's name.
  let name: string | undefined = user.name;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body.name === 'string' && body.name.trim()) name = body.name.trim();
  } catch { /* no body — fine */ }

  const sent = await sendRegistrationAck(user.email, name);
  return NextResponse.json({ ok: sent });
}
