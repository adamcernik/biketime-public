import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminBucket, adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_MS = 15 * 60 * 1000; // 15 minut

/**
 * GET /api/invoices/[id]/download[?mode=download]
 *
 * Ověří partnera (Firebase ID token) a vlastnictví faktury, pak vydá
 * krátkodobý podepsaný odkaz na PDF ve Storage. `mode=download` vynutí
 * stažení souboru (attachment), jinak se PDF otevře v prohlížeči.
 * Žádné dlouhověké download URL — odkaz vyprší za 15 minut.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Přihlášení je vyžadováno.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const snap = await adminDb.collection('invoices').doc(id).get();
    const data = snap.data();
    // 404 i pro cizí faktury — neprozrazujeme, že dokument existuje.
    if (!snap.exists || !data || data.userId !== user.uid) {
      return NextResponse.json({ error: 'Faktura nenalezena.' }, { status: 404 });
    }

    const mode = new URL(request.url).searchParams.get('mode');
    const fileName = String(data.fileName ?? 'faktura.pdf').replace(/"/g, '');
    const [url] = await adminBucket.file(String(data.storagePath)).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
      ...(mode === 'download'
        ? { responseDisposition: `attachment; filename="${fileName}"` }
        : { responseDisposition: 'inline' }),
    });

    snap.ref.update({ lastDownloadedAt: Timestamp.now() }).catch(() => {
      /* audit je best-effort, stažení neblokuje */
    });

    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) {
    console.error('invoice download error', e);
    return NextResponse.json({ error: 'Odkaz se nepodařilo vytvořit.' }, { status: 500 });
  }
}
