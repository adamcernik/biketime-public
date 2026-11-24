import { DEFAULT_FEED_FILTERS, FeedFilters, FeedPriceLevel } from './mapProduct';

// Z dokumentu partnera (users/{uid}) odvodí, co jeho feed dostane: hladinu
// VOC a uložené filtry. Sdílí to ostrý endpoint (/api/feeds/catalog) i admin
// náhled (/api/admin/feeds/preview), aby náhled nikdy nemohl ukázat něco
// jiného, než co partnerovi reálně odchází.

export type FeedAccess = 'active' | 'disabled' | 'no-access' | 'none';

export interface PartnerFeedConfig {
    level: FeedPriceLevel;
    filters: FeedFilters;
    /** Proč feed (ne)funguje: active = vrací data; ostatní = endpoint odmítne. */
    access: FeedAccess;
    lastFetchAt: string | null;
    lastFetchFormat: string | null;
}

export function parseFeedLevel(raw: unknown): FeedPriceLevel {
    return (typeof raw === 'string' && ['A', 'B', 'C', 'D'].includes(raw) ? raw : 'A') as FeedPriceLevel;
}

export function parseFeedFilters(raw: unknown): FeedFilters {
    const s = (raw || {}) as Partial<FeedFilters>;
    return {
        ebike: s.ebike === 'ebike' || s.ebike === 'bike' ? s.ebike : DEFAULT_FEED_FILTERS.ebike,
        onlyAvailable: s.onlyAvailable === true,
    };
}

export function partnerFeedConfig(user: Record<string, unknown>): PartnerFeedConfig {
    const feed = (user.feed || {}) as Record<string, unknown>;
    let access: FeedAccess = 'active';
    if (!feed.token) access = 'none';
    else if (user.hasAccess !== true) access = 'no-access';
    else if (feed.enabled === false) access = 'disabled';

    return {
        level: parseFeedLevel(user.priceLevel),
        filters: parseFeedFilters(feed.settings),
        access,
        lastFetchAt: typeof feed.lastFetchAt === 'string' ? feed.lastFetchAt : null,
        lastFetchFormat: typeof feed.lastFetchFormat === 'string' ? feed.lastFetchFormat : null,
    };
}
