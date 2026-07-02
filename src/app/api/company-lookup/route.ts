import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { isValidIco, normalizeIco } from '@/lib/validation/ico';
import { rateLimit } from '@/lib/rateLimit';
import { fetchFromAres, type CompanyData } from '@/lib/ares';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — ARES updates daily

type AresError =
    | 'INVALID_ICO'
    | 'NOT_FOUND'
    | 'COMPANY_TERMINATED'
    | 'DUPLICATE'
    | 'RATE_LIMITED'
    | 'ARES_UNAVAILABLE';

// HTTP status per error — the client maps these to the UX in the spec (§3.3).
const STATUS: Record<AresError, number> = {
    INVALID_ICO: 400,
    NOT_FOUND: 404,
    COMPANY_TERMINATED: 409,
    DUPLICATE: 409,
    RATE_LIMITED: 429,
    ARES_UNAVAILABLE: 503,
};

function fail(error: AresError, extra?: Record<string, unknown>) {
    return NextResponse.json({ ok: false, error, ...extra }, { status: STATUS[error] });
}

export async function POST(request: Request) {
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // 1. Rate limit — 60 requests / minute / IP. Coarse abuse guard.
    const allowed = await rateLimit(`ares:${ip}`, 60, 60);
    if (!allowed) return fail('RATE_LIMITED');

    // 2. Parse + validate IČO server-side (never trust the client).
    let ico = '';
    try {
        const body = (await request.json()) as { ico?: string };
        ico = normalizeIco(String(body?.ico ?? ''));
    } catch {
        return fail('INVALID_ICO');
    }
    if (!isValidIco(ico)) return fail('INVALID_ICO');

    // Optional caller identity: registration is anonymous, but the self-service
    // "doplňte IČO" flow is authenticated — we must NOT flag the caller's own
    // record as a duplicate of itself.
    const caller = await getVerifiedUser(request);

    // 3. Duplicity check BEFORE hitting ARES (avoids needless upstream calls).
    const dup = await adminDb
        .collection('users')
        .where('company.ico', '==', ico)
        .limit(2)
        .get();
    const foreignDup = dup.docs.find((d) => d.id !== caller?.uid);
    if (foreignDup) {
        await logLookup(ico, ip, 'duplicate');
        const email = foreignDup.data()?.email as string | undefined;
        return fail('DUPLICATE', email ? { existingEmail: email } : undefined);
    }

    // 4. Cache lookup (24h TTL enforced in app logic).
    const cacheRef = adminDb.collection('aresCache').doc(ico);
    const cached = await cacheRef.get();
    if (cached.exists) {
        const { data, cachedAt } = cached.data() as { data: CompanyData; cachedAt: number };
        if (Date.now() - cachedAt < CACHE_TTL_MS) {
            await logLookup(ico, ip, 'cache_hit');
            return NextResponse.json({ ok: true, data });
        }
    }

    // 5. ARES call.
    const result = await fetchFromAres(ico);
    if (result.kind === 'not_found') {
        await logLookup(ico, ip, 'not_found');
        return fail('NOT_FOUND');
    }
    if (result.kind === 'terminated') {
        await logLookup(ico, ip, 'terminated');
        return fail('COMPANY_TERMINATED');
    }
    if (result.kind === 'unavailable') {
        await logLookup(ico, ip, 'error');
        return fail('ARES_UNAVAILABLE');
    }

    // 6. Cache the mapped subset + raw (raw stays server-side only).
    await cacheRef.set({
        data: result.data,
        raw: result.raw,
        cachedAt: Date.now(),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    });

    await logLookup(ico, ip, 'ok');
    return NextResponse.json({ ok: true, data: result.data });
}

async function logLookup(ico: string, ip: string, result: string, error?: string) {
    try {
        await adminDb.collection('aresLookups').add({
            ico,
            ip,
            result,
            error: error ?? null,
            createdAt: Date.now(),
            // GDPR minimization: native Firestore TTL policy on expiresAt
            // deletes audit entries (they hold IPs) after 90 days.
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
    } catch {
        // Audit logging is best-effort — never fail a lookup because logging broke.
    }
}
