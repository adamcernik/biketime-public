import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { isValidIco, normalizeIco } from '@/lib/validation/ico';
import { rateLimit } from '@/lib/rateLimit';
import { fetchFromAres, type CompanyData } from '@/lib/ares';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — ARES updates daily

// Also called cross-origin by the admin dashboard (see admin params below).
// Reflect the origin from an allowlist so local admin dev (:3010) works too.
const ALLOWED_ORIGINS = [
    process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz',
    'http://localhost:3010',
];
const corsFor = (request: Request) => {
    const origin = request.headers.get('origin') || '';
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };
};

type AresError =
    | 'INVALID_ICO'
    | 'NOT_FOUND'
    | 'COMPANY_TERMINATED'
    | 'DUPLICATE'
    | 'RATE_LIMITED'
    | 'ARES_UNAVAILABLE'
    | 'FORBIDDEN';

// HTTP status per error — the client maps these to the UX in the spec (§3.3).
const STATUS: Record<AresError, number> = {
    INVALID_ICO: 400,
    NOT_FOUND: 404,
    COMPANY_TERMINATED: 409,
    DUPLICATE: 409,
    RATE_LIMITED: 429,
    ARES_UNAVAILABLE: 503,
    FORBIDDEN: 403,
};

export function OPTIONS(request: Request) {
    return new NextResponse(null, { status: 204, headers: corsFor(request) });
}

export async function POST(request: Request) {
    const CORS = corsFor(request);
    const ok = (body: Record<string, unknown>) =>
        NextResponse.json({ ok: true, ...body }, { headers: CORS });
    const fail = (error: AresError, extra?: Record<string, unknown>) =>
        NextResponse.json({ ok: false, error, ...extra }, { status: STATUS[error], headers: CORS });

    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // 1. Rate limit — 60 requests / minute / IP. Coarse abuse guard.
    const allowed = await rateLimit(`ares:${ip}`, 60, 60);
    if (!allowed) return fail('RATE_LIMITED');

    // 2. Parse + validate server-side (never trust the client).
    let ico = '';
    let targetUid: string | undefined;
    let forceRefresh = false;
    let includeRaw = false;
    try {
        const body = (await request.json()) as {
            ico?: string;
            targetUid?: string;
            forceRefresh?: boolean;
            includeRaw?: boolean;
        };
        ico = normalizeIco(String(body?.ico ?? ''));
        targetUid = typeof body?.targetUid === 'string' ? body.targetUid : undefined;
        forceRefresh = body?.forceRefresh === true;
        includeRaw = body?.includeRaw === true;
    } catch {
        return fail('INVALID_ICO');
    }
    if (!isValidIco(ico)) return fail('INVALID_ICO');

    // Optional caller identity: registration is anonymous, the self-service
    // flow is authenticated, and the admin dashboard sends admin params.
    const caller = await getVerifiedUser(request);

    // Admin-only params: targetUid (lookup on behalf of a partner — exclude
    // THEIR record from the duplicity check, not the admin's), forceRefresh
    // ("Znovu ověřit" bypasses the cache), includeRaw (poweradmin debugging).
    let isAdmin = false;
    let isPowerAdmin = false;
    if (targetUid !== undefined || forceRefresh || includeRaw) {
        if (!caller) return fail('FORBIDDEN');
        const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
        const role = callerDoc.exists ? (callerDoc.data()?.role as string | undefined) : undefined;
        isPowerAdmin = role === 'poweradmin';
        isAdmin = role === 'admin' || isPowerAdmin;
        if (!isAdmin) return fail('FORBIDDEN');
        if (includeRaw && !isPowerAdmin) return fail('FORBIDDEN');
    }

    // 3. Duplicity check BEFORE hitting ARES (avoids needless upstream calls).
    // Excluded uid: the partner being edited (admin flow) or the caller (self-service).
    const excludeUid = isAdmin && targetUid ? targetUid : caller?.uid;
    const dup = await adminDb
        .collection('users')
        .where('company.ico', '==', ico)
        .limit(2)
        .get();
    const foreignDup = dup.docs.find((d) => d.id !== excludeUid);
    if (foreignDup) {
        await logLookup(ico, ip, 'duplicate');
        const email = foreignDup.data()?.email as string | undefined;
        return fail('DUPLICATE', email ? { existingEmail: email } : undefined);
    }

    // 4. Cache lookup (24h TTL in app logic; admins may force-skip).
    const cacheRef = adminDb.collection('aresCache').doc(ico);
    if (!forceRefresh) {
        const cached = await cacheRef.get();
        if (cached.exists) {
            const { data, cachedAt, raw } = cached.data() as {
                data: CompanyData;
                cachedAt: number;
                raw?: Record<string, unknown>;
            };
            if (Date.now() - cachedAt < CACHE_TTL_MS) {
                await logLookup(ico, ip, 'cache_hit');
                return ok({ data, ...(includeRaw ? { raw } : {}) });
            }
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

    // 6. Cache the mapped subset + raw (raw leaves the server only for poweradmin).
    await cacheRef.set({
        data: result.data,
        raw: result.raw,
        cachedAt: Date.now(),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    });

    await logLookup(ico, ip, 'ok');
    return ok({ data: result.data, ...(includeRaw ? { raw: result.raw } : {}) });
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
