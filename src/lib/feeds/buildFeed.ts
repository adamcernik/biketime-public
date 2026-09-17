import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { FeedItem, FeedPriceLevel, isProductFeedVisible, mapProductToFeedItems } from './mapProduct';

// Sestavení feedu z products_v2 se stejnou viditelností jako veřejný katalog:
// archivované nikdy, preorder-only jen pokud je předobjednávková sekce
// otevřená a produkt je v kurátorovaném seznamu.
//
// Ceny se liší jen podle hladiny A–D, takže se hotový seznam cachuje per
// hladina (ne per partner) v paměti instance — TTL drží zátěž Firestore nízko
// i při mnoha odběratelích na stejné hladině.

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 h

interface CacheEntry {
    at: number;
    items: FeedItem[];
}

const cache = new Map<FeedPriceLevel, Promise<CacheEntry>>();

async function buildFeedItems(level: FeedPriceLevel): Promise<CacheEntry> {
    const [snapshot, preorderSettings] = await Promise.all([
        adminDb.collection('products_v2').get(),
        adminDb.collection('settings').doc('preorders').get(),
    ]);

    const preordersOpen = preorderSettings.exists && preorderSettings.get('enabled') === true;
    const idsRaw: unknown = preorderSettings.exists ? preorderSettings.get('productIds') : [];
    const visiblePreorderIds = new Set<string>(preordersOpen && Array.isArray(idsRaw) ? idsRaw : []);

    const items: FeedItem[] = [];
    for (const doc of snapshot.docs) {
        const p = doc.data();
        if (p.archived === true) continue;
        if (p.preorderOnly === true && !visiblePreorderIds.has(doc.id)) continue;
        if (!isProductFeedVisible(p)) continue;
        items.push(...mapProductToFeedItems(doc.id, p, level));
    }

    items.sort((a, b) =>
        a.category.localeCompare(b.category, 'cs')
        || a.model.localeCompare(b.model, 'cs')
        || (b.year - a.year)
        || a.itemId.localeCompare(b.itemId));

    return { at: Date.now(), items };
}

/** Položky feedu pro hladinu — z paměťové cache, po TTL se sestaví znovu. */
export async function getFeedItems(level: FeedPriceLevel): Promise<FeedItem[]> {
    const cached = cache.get(level);
    if (cached) {
        try {
            const entry = await cached;
            if (Date.now() - entry.at < CACHE_TTL_MS) return entry.items;
        } catch {
            /* neúspěšné sestavení se nesmí zaseknout v cache */
        }
    }
    const fresh = buildFeedItems(level);
    cache.set(level, fresh);
    try {
        return (await fresh).items;
    } catch (err) {
        cache.delete(level);
        throw err;
    }
}
