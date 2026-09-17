import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { DEFAULT_FEED_FILTERS, FeedFilters } from '@/lib/feeds/mapProduct';

export const dynamic = 'force-dynamic';

// Správa partnerova feedu (/zona/feedy): GET vrací (a při prvním použití
// založí) token a nastavení, PUT ukládá filtry, POST {action:'regenerate'}
// vymění token — stará URL tím okamžitě přestane platit.

function newToken(): string {
    return randomBytes(24).toString('base64url'); // 32 znaků
}

function parseFilters(raw: unknown): FeedFilters {
    const s = (raw || {}) as Partial<FeedFilters>;
    return {
        ebike: s.ebike === 'ebike' || s.ebike === 'bike' ? s.ebike : DEFAULT_FEED_FILTERS.ebike,
        onlyAvailable: s.onlyAvailable === true,
    };
}

interface FeedState {
    token: string;
    settings: FeedFilters;
    lastFetchAt: string | null;
    lastFetchFormat: string | null;
}

function toState(feed: Record<string, unknown>): FeedState {
    return {
        token: String(feed.token || ''),
        settings: parseFilters(feed.settings),
        lastFetchAt: typeof feed.lastFetchAt === 'string' ? feed.lastFetchAt : null,
        lastFetchFormat: typeof feed.lastFetchFormat === 'string' ? feed.lastFetchFormat : null,
    };
}

export async function GET(request: NextRequest) {
    const customer = await getApprovedCustomer(request);
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ref = adminDb.collection('users').doc(customer.uid);
    const snap = await ref.get();
    const feed = ((snap.data() || {}).feed || {}) as Record<string, unknown>;

    if (!feed.token) {
        feed.token = newToken();
        feed.createdAt = new Date().toISOString();
        feed.settings = DEFAULT_FEED_FILTERS;
        await ref.set({ feed }, { merge: true });
    }

    return NextResponse.json(toState(feed), { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: NextRequest) {
    const customer = await getApprovedCustomer(request);
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const settings = parseFilters((body as { settings?: unknown }).settings);

    await adminDb.collection('users').doc(customer.uid)
        .set({ feed: { settings } }, { merge: true });

    return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
    const customer = await getApprovedCustomer(request);
    if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let action = '';
    try {
        action = String(((await request.json()) as { action?: unknown }).action || '');
    } catch {
        /* prázdné tělo */
    }
    if (action !== 'regenerate') {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const token = newToken();
    await adminDb.collection('users').doc(customer.uid)
        .set({ feed: { token, createdAt: new Date().toISOString() } }, { merge: true });

    return NextResponse.json({ token });
}
