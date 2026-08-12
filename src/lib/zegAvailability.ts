import SftpClient from 'ssh2-sftp-client';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ZEG availability feed (ArtVerfNeuZEGDE.asc na sftp1.zeg.de):
// CSV řádky `ZEG,<artikl>,<status>,<KW>,<?>` — kompletní sortiment vč. statusu 0.
// Status: 0 = nedostupné, 1 = nízká, 2 = normální/vysoká, 3 = neznámá dostupnost.
// KW = kalendářní týden, od kterého má být artikl znovu dostupný (0 = žádný termín).
// Feed obsahuje jen aktuální sklad ZEG, budoucnost pouze přes KW.

export type ZegStatus = 0 | 1 | 2 | 3;

export interface ZegVariantAvailability {
    /** Verfügbarkeitsstatus 0–3 */
    s: ZegStatus;
    /** Kalendářní týden příští dostupnosti, 0 = neznámý */
    kw: number;
}

export interface ZegProductAvailability {
    /** Nejlepší status napříč variantami (2 > 1 > 3 > 0) */
    best: ZegStatus;
    /** Nejbližší nenulový KW napříč variantami, 0 pokud žádný */
    nextKw: number;
    /** variantId → dostupnost (klíče beze změny, jak jsou v products_v2) */
    variants: Record<string, ZegVariantAvailability>;
    updatedAt: string;
}

const FEED_FILE = '/ArtVerfNeuZEGDE.asc';

/** Stáhne feed ze SFTP a vrátí mapu artikl (bez pomlček) → dostupnost. */
export async function fetchZegFeed(): Promise<Map<string, ZegVariantAvailability>> {
    const host = process.env.ZEG_SFTP_HOST;
    const username = process.env.ZEG_SFTP_USER;
    const password = process.env.ZEG_SFTP_PASSWORD;
    if (!host || !username || !password) {
        throw new Error('ZEG SFTP credentials missing (ZEG_SFTP_HOST/USER/PASSWORD)');
    }

    const sftp = new SftpClient();
    let raw: string;
    try {
        await sftp.connect({ host, username, password, readyTimeout: 20000 });
        raw = (await sftp.get(FEED_FILE)).toString('utf8');
    } finally {
        await sftp.end().catch(() => undefined);
    }

    const map = new Map<string, ZegVariantAvailability>();
    for (const line of raw.split(/\r?\n/)) {
        const parts = line.split(',');
        if (parts.length < 4) continue;
        const art = parts[1].replace(/-/g, '').trim();
        const s = Number(parts[2]);
        const kw = Number(parts[3]);
        if (!art || !Number.isInteger(s) || s < 0 || s > 3) continue;
        map.set(art, { s: s as ZegStatus, kw: Number.isInteger(kw) && kw > 0 ? kw : 0 });
    }
    if (map.size === 0) throw new Error('ZEG feed parsed to 0 articles — refusing to sync');
    return map;
}

/** Pořadí „lepší dostupnosti": normální > nízká > neznámá > žádná. */
const STATUS_RANK: Record<ZegStatus, number> = { 2: 3, 1: 2, 3: 1, 0: 0 };

interface ProductVariant {
    id?: string | number;
}

export interface ZegSyncResult {
    feedArticles: number;
    productsScanned: number;
    productsMatched: number;
    variantsMatched: number;
    productsUpdated: number;
    productsCleared: number;
}

/**
 * Zapíše dostupnost ZEG do products_v2 jako jediné top-level pole `zeg`
 * (nesahá na `variants` — žádné riziko přepsání souběžných admin úprav).
 * Produkty bez shody ve feedu pole `zeg` ztratí (feed = úplný sortiment ZEG).
 */
export async function syncZegAvailability(): Promise<ZegSyncResult> {
    const feed = await fetchZegFeed();
    const snap = await adminDb.collection('products_v2').get();

    const result: ZegSyncResult = {
        feedArticles: feed.size,
        productsScanned: snap.size,
        productsMatched: 0,
        variantsMatched: 0,
        productsUpdated: 0,
        productsCleared: 0,
    };

    const updatedAt = new Date().toISOString();
    let batch = adminDb.batch();
    let batchOps = 0;
    const commits: Promise<unknown>[] = [];
    const flush = () => {
        if (batchOps > 0) {
            commits.push(batch.commit());
            batch = adminDb.batch();
            batchOps = 0;
        }
    };

    for (const doc of snap.docs) {
        const data = doc.data();
        const variants: ProductVariant[] = Array.isArray(data.variants) ? data.variants : [];

        const matched: Record<string, ZegVariantAvailability> = {};
        for (const v of variants) {
            if (v.id === undefined || v.id === null) continue;
            const hit = feed.get(String(v.id).replace(/-/g, ''));
            if (hit) matched[String(v.id)] = hit;
        }

        const entries = Object.values(matched);
        if (entries.length > 0) {
            result.productsMatched++;
            result.variantsMatched += entries.length;
            const best = entries.reduce<ZegStatus>(
                (acc, e) => (STATUS_RANK[e.s] > STATUS_RANK[acc] ? e.s : acc),
                0,
            );
            const kws = entries.map((e) => e.kw).filter((kw) => kw > 0);
            const zeg: ZegProductAvailability = {
                best,
                nextKw: kws.length > 0 ? Math.min(...kws) : 0,
                variants: matched,
                updatedAt,
            };
            batch.update(doc.ref, { zeg });
            result.productsUpdated++;
            batchOps++;
        } else if (data.zeg !== undefined) {
            batch.update(doc.ref, { zeg: FieldValue.delete() });
            result.productsCleared++;
            batchOps++;
        }
        if (batchOps >= 400) flush();
    }
    flush();
    await Promise.all(commits);
    return result;
}
