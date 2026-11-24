import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { getFeedItems } from '@/lib/feeds/buildFeed';
import { applyFeedFilters, FeedFilters } from '@/lib/feeds/mapProduct';
import { parseFeedFilters, parseFeedLevel, partnerFeedConfig } from '@/lib/feeds/partnerConfig';
import { FEED_CONTENT_TYPES, FeedFormat, serializeFeed } from '@/lib/feeds/serialize';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/feeds/preview — náhled partnerského feedu pro administraci
 * (b2b.biketime.cz, server → server s ADMIN_API_KEY).
 *
 * Vrací PŘESNĚ to, co by dostal odběratel: stejný buildFeed → applyFeedFilters
 * → serializeFeed jako /api/feeds/catalog, včetně hodinové cache per hladina.
 * Jen se nezapisuje „naposledy staženo" a neplatí limit požadavků na token.
 *
 * Parametry:
 *   uid=<partner>            feed očima konkrétního partnera (jeho hladina,
 *                            jeho uložené filtry; stav feedu v X-Feed-Access)
 *   level=A|B|C|D            nebo ruční nastavení bez partnera
 *   ebike=all|ebike|bike, onlyAvailable=1
 *   format=xml|csv|json|heureka  (výchozí json)
 *
 * Metadata jdou v hlavičkách, aby tělo zůstalo bajt po bajtu shodné s feedem.
 */
const FORMATS: FeedFormat[] = ['xml', 'csv', 'json', 'heureka'];

export async function GET(request: NextRequest) {
    if (!isAdminAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const q = new URL(request.url).searchParams;
        const formatParam = (q.get('format') || 'json').toLowerCase();
        const format = (FORMATS.includes(formatParam as FeedFormat) ? formatParam : 'json') as FeedFormat;
        const uid = (q.get('uid') || '').trim();

        let level = parseFeedLevel(q.get('level'));
        let filters: FeedFilters = parseFeedFilters({
            ebike: q.get('ebike'),
            onlyAvailable: q.get('onlyAvailable') === '1' || q.get('onlyAvailable') === 'true',
        });
        const meta: Record<string, string> = {};

        if (uid) {
            if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
                return NextResponse.json({ error: 'Neplatné uid' }, { status: 400 });
            }
            const snap = await adminDb.collection('users').doc(uid).get();
            if (!snap.exists) return NextResponse.json({ error: 'Partner neexistuje' }, { status: 404 });
            const cfg = partnerFeedConfig(snap.data() as Record<string, unknown>);
            level = cfg.level;
            filters = cfg.filters;
            meta['X-Feed-Access'] = cfg.access;
            if (cfg.lastFetchAt) meta['X-Feed-Last-Fetch-At'] = cfg.lastFetchAt;
            if (cfg.lastFetchFormat) meta['X-Feed-Last-Fetch-Format'] = cfg.lastFetchFormat;
        }

        const items = applyFeedFilters(await getFeedItems(level), filters);
        const generatedAt = new Date().toISOString();
        const body = serializeFeed(format, items, { level, generatedAt });

        return new NextResponse(body, {
            headers: {
                'Content-Type': FEED_CONTENT_TYPES[format],
                'Cache-Control': 'private, no-store',
                'X-Robots-Tag': 'noindex, nofollow',
                'X-Feed-Format': format,
                'X-Feed-Level': level,
                'X-Feed-Ebike': filters.ebike,
                'X-Feed-Only-Available': filters.onlyAvailable ? '1' : '0',
                'X-Feed-Item-Count': String(items.length),
                'X-Feed-Generated-At': generatedAt,
                ...meta,
            },
        });
    } catch (error) {
        console.error('Feed preview error:', error);
        return NextResponse.json({ error: 'Náhled feedu se nepodařilo sestavit.' }, { status: 500 });
    }
}
