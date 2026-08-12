import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { syncZegAvailability } from '@/lib/zegAvailability';

export const dynamic = 'force-dynamic';
// SFTP stažení + zápis ~200 dokumentů; default 300 s stačí, ale ať máme rezervu
export const maxDuration = 300;

/**
 * Timing-safe check `Authorization: Bearer <CRON_SECRET>` (posílá Vercel Cron).
 * Fails closed, když CRON_SECRET není nastavený.
 */
function isCronAuthorized(request: Request): boolean {
    const expected = process.env.CRON_SECRET;
    if (!expected) return false;

    const authHeader = request.headers.get('authorization') || '';
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!provided) return false;

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    if (expectedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(request: Request) {
    if (!isCronAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await syncZegAvailability();
        console.log('ZEG sync done:', JSON.stringify(result));
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error('ZEG sync failed:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
            { status: 500 },
        );
    }
}
