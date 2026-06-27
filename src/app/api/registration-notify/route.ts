import { NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/userAuth';
import { sendRegistrationNotifyToAdmin } from '@/lib/registrationEmail';

// Notifies info@biketime.cz that a shop submitted a registration. Secured by the
// registering user's own Firebase ID token; recipient is fixed (info@), the
// e-mail address comes from the verified token, the rest from the form body.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getVerifiedUser(request);
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

  const sent = await sendRegistrationNotifyToAdmin({
    email: user.email,
    companyName: str(body.companyName),
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    phone: str(body.phone),
    companyAddress: str(body.companyAddress),
  });
  return NextResponse.json({ ok: sent });
}
