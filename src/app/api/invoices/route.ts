import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invoices — seznam faktur přihlášeného partnera.
 *
 * Faktury nahrává admin v admin aplikaci (kolekce `invoices`, PDF ve
 * Storage). Vracíme jen metadata faktur patřících ověřenému uživateli;
 * samotné PDF se stahuje přes /api/invoices/[id]/download.
 */
export async function GET(request: Request) {
  const user = await getVerifiedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Přihlášení je vyžadováno.' }, { status: 401 });
  }

  try {
    const snap = await adminDb.collection('invoices').where('userId', '==', user.uid).get();
    const invoices = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          cislo: String(data.cislo ?? ''),
          castka: typeof data.castka === 'number' ? data.castka : null,
          datum: data.datum?.toDate?.()?.toISOString() ?? null,
          splatnost: data.splatnost?.toDate?.()?.toISOString() ?? null,
          fileName: String(data.fileName ?? 'faktura.pdf'),
          size: typeof data.size === 'number' ? data.size : null,
        };
      })
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''));

    return NextResponse.json({ invoices }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    console.error('invoices list error', e);
    return NextResponse.json({ error: 'Faktury se nepodařilo načíst.' }, { status: 500 });
  }
}
