import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { presignGetUrl } from '@/lib/r2';

// Volá administrace (b2b.biketime.cz): vydá podepsané odkazy na přílohy
// reklamace v R2. R2 credentials žijí jen tady v public repu — admin se
// prokazuje Firebase ID tokenem (role admin/poweradmin), stejný vzor jako
// send-approved-email. Cross-origin z admin aplikace → CORS níže.
export const dynamic = 'force-dynamic';

const ADMIN_ORIGIN = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';
const CORS = {
    'Access-Control-Allow-Origin': ADMIN_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: { ...CORS, 'Cache-Control': 'private, no-store' } });

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const caller = await getVerifiedUser(request);
    if (!caller) return json({ error: 'Unauthorized' }, 401);

    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    const role = callerDoc.exists ? (callerDoc.data()?.role as string | undefined) : undefined;
    if (role !== 'admin' && role !== 'poweradmin') {
        return json({ error: 'Forbidden' }, 403);
    }

    const { id } = await params;
    try {
        const snap = await adminDb.collection('claims').doc(id).get();
        const data = snap.data();
        if (!snap.exists || !data) return json({ error: 'Claim not found' }, 404);

        const media: { key: string; fileName?: string; contentType?: string; size?: number }[] =
            Array.isArray(data.media) ? data.media : [];
        const urls = await Promise.all(media.map(async m => ({
            key: m.key,
            fileName: m.fileName || 'soubor',
            contentType: m.contentType || '',
            size: m.size || 0,
            url: await presignGetUrl(m.key, 900),
        })));

        return json({ urls });
    } catch (e) {
        console.error('admin claim media error', e);
        return json({ error: 'Odkazy se nepodařilo vytvořit.' }, 500);
    }
}
