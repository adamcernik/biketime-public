import { NextRequest, NextResponse, after } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { rateLimit } from '@/lib/rateLimit';
import { getFeedItems } from '@/lib/feeds/buildFeed';
import { applyFeedFilters, DEFAULT_FEED_FILTERS, FeedFilters, FeedPriceLevel } from '@/lib/feeds/mapProduct';
import { FEED_CONTENT_TYPES, FeedFormat, serializeFeed } from '@/lib/feeds/serialize';

export const dynamic = 'force-dynamic';

// Produktový feed pro partnery: trvalá tajná URL, kterou si partnerův e-shop
// stahuje sám (bez přihlášení). Token = autentizace; partner ho spravuje na
// /zona/feedy. Odpověď obsahuje dealerské VOC pro JEHO hladinu, proto se
// nikdy nesmí cachovat sdíleně a endpoint při každém požadavku znovu ověřuje
// hasAccess (vypnutý partner = mrtvý feed okamžitě).

const FORMATS: FeedFormat[] = ['xml', 'csv', 'json', 'heureka'];
/** Zápis „naposledy staženo" nejvýš jednou za 10 minut (šetří writes). */
const LAST_FETCH_WRITE_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = (searchParams.get('token') || '').trim();
        const formatParam = (searchParams.get('format') || 'xml').toLowerCase();
        const format = (FORMATS.includes(formatParam as FeedFormat) ? formatParam : 'xml') as FeedFormat;

        if (!token || token.length < 20) {
            return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
        }

        // Hrubá ochrana proti hádání tokenů i proti zběsilému stahování.
        if (!(await rateLimit(`feed:${token.slice(0, 12)}`, 60, 3600))) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const snap = await adminDb.collection('users')
            .where('feed.token', '==', token)
            .limit(1)
            .get();
        if (snap.empty) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userDoc = snap.docs[0];
        const u = userDoc.data() as Record<string, unknown>;
        const feedCfg = (u.feed || {}) as Record<string, unknown>;
        if (u.hasAccess !== true || feedCfg.enabled === false) {
            return NextResponse.json({ error: 'Feed disabled' }, { status: 403 });
        }

        const level = (typeof u.priceLevel === 'string' && ['A', 'B', 'C', 'D'].includes(u.priceLevel)
            ? u.priceLevel
            : 'A') as FeedPriceLevel;

        const saved = (feedCfg.settings || {}) as Partial<FeedFilters>;
        const filters: FeedFilters = {
            ebike: saved.ebike === 'ebike' || saved.ebike === 'bike' ? saved.ebike : DEFAULT_FEED_FILTERS.ebike,
            onlyAvailable: saved.onlyAvailable === true,
        };

        const items = applyFeedFilters(await getFeedItems(level), filters);
        const body = serializeFeed(format, items, { level, generatedAt: new Date().toISOString() });

        // Throttlovaný záznam posledního stažení — po odeslání odpovědi.
        const lastFetchAt = typeof feedCfg.lastFetchAt === 'string' ? Date.parse(feedCfg.lastFetchAt) : 0;
        if (!lastFetchAt || Date.now() - lastFetchAt > LAST_FETCH_WRITE_MS) {
            after(() => userDoc.ref
                .set({ feed: { lastFetchAt: new Date().toISOString(), lastFetchFormat: format } }, { merge: true })
                .catch(() => undefined));
        }

        return new NextResponse(body, {
            headers: {
                'Content-Type': FEED_CONTENT_TYPES[format],
                'Content-Disposition': `inline; filename="biketime-feed.${format === 'heureka' ? 'heureka.xml' : format}"`,
                'Cache-Control': 'private, no-store',
                'X-Robots-Tag': 'noindex, nofollow',
            },
        });
    } catch (error) {
        console.error('Feed error:', error);
        return NextResponse.json({ error: 'Feed se nepodařilo sestavit.' }, { status: 500 });
    }
}
