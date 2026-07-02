import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';
import { fetchFromAres } from '@/lib/ares';

// Poweradmin bulk action from the admin dashboard: re-verify every partner
// that has company.ico against ARES. Fresh data overwrites the company block
// (aresVerifiedAt bumped, aresEditedAfterVerify cleared). Terminated companies
// are NEVER auto-blocked (could be a merger/rename — spec §6.4); they are
// flagged (company.aresTerminated) and reported for manual review.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ADMIN_ORIGIN = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';
const CORS = {
    'Access-Control-Allow-Origin': ADMIN_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: CORS });

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS });
}

type Entry = { uid: string; ico: string; companyName: string };

export async function POST(request: Request) {
    const caller = await getVerifiedUser(request);
    if (!caller) return json({ error: 'Unauthorized' }, 401);

    const callerDoc = await adminDb.collection('users').doc(caller.uid).get();
    const role = callerDoc.exists ? (callerDoc.data()?.role as string | undefined) : undefined;
    if (role !== 'poweradmin') return json({ error: 'Forbidden' }, 403);

    // All partners with an IČO (automatic single-field index covers this).
    const snap = await adminDb
        .collection('users')
        .where('company.ico', '>=', '0')
        .get();

    const report = {
        checked: 0,
        updated: 0,
        terminated: [] as Entry[],
        notFound: [] as Entry[],
        failed: [] as Entry[],
    };

    for (const docSnap of snap.docs) {
        const u = docSnap.data();
        const ico = u.company?.ico as string | undefined;
        if (!ico) continue;
        report.checked++;
        const entry: Entry = {
            uid: docSnap.id,
            ico,
            companyName: (u.companyName as string) || (u.company?.legalName as string) || '—',
        };

        const result = await fetchFromAres(ico);

        if (result.kind === 'unavailable') {
            report.failed.push(entry);
            continue;
        }
        if (result.kind === 'not_found') {
            report.notFound.push(entry);
            continue;
        }
        if (result.kind === 'terminated') {
            report.terminated.push(entry);
            await docSnap.ref.update({
                'company.aresTerminated': true,
                'company.aresVerifiedAt': new Date().toISOString(),
                updatedAt: new Date(),
            });
            continue;
        }

        const d = result.data;
        await docSnap.ref.update({
            company: {
                ...u.company,
                ico: d.ico,
                vatId: d.vatId,
                legalName: d.legalName,
                street: d.street,
                city: d.city,
                zip: d.zip,
                country: d.country,
                legalFormCode: d.legalFormCode,
                foundedAt: d.foundedAt,
                isVatPayer: d.isVatPayer,
                aresVerifiedAt: new Date().toISOString(),
                aresEditedAfterVerify: false,
                aresTerminated: false,
            },
            updatedAt: new Date(),
        });
        await adminDb.collection('aresCache').doc(ico).set({
            data: d,
            raw: result.raw,
            cachedAt: Date.now(),
            expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        });
        report.updated++;

        // Stay far below the ARES per-IP limit (~500/min).
        await new Promise((r) => setTimeout(r, 150));
    }

    return json({ ok: true, report });
}
