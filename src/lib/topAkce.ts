import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/**
 * TOP AKCE — akční nabídka kol pro schválené obchodníky (menu „TOP AKCE").
 *
 * Zdroj: `top_akce_items/{artNr}` (plní admin importem z tabulky s výběrem
 * kol) + `settings/topAkce` (kurz EUR→CZK, zapnutí). Kusy jsou od výrobce
 * (sklad DE + na cestě ASI); dostupné = kusy − už objednané kusy z nezrušených
 * objednávek v `orders` se `source: 'top-akce'`. Žádný čítač rezervací —
 * dostupnost se vždy počítá z objednávek, takže zrušení v adminu kusy uvolní.
 *
 * Ceny: VOC a UVP jsou v EUR a přepočítávají se kurzem; akční MOC s DPH je
 * zadaná v CZK. Vše se počítá tady na serveru, klient dostane hotové CZK.
 */

export const TOP_AKCE_SOURCE = 'top-akce';
const ITEMS = 'top_akce_items';

export interface TopAkceSettings {
    eurCzk: number;
    published: boolean;
    intro: string;
}

export interface TopAkceItemDoc {
    artNr: string;
    name: string;
    displayName: string;
    brand: string;
    year: number | null;
    groupKey: string;
    uvpEur: number | null;
    vocEur: number;
    mocCzk: number;
    qtyDe: number;
    qtyAsi: number;
    isEbike: boolean;
    active: boolean;
    order: number;
    productId: string | null;
    image: string | null;
    color: string | null;
    size: string | null;
    frameType?: string | null;
    capacity: string | null;
    category: string | null;
}

/** Položka, jak ji vidí web. */
export interface TopAkcePublicItem {
    artNr: string;
    groupKey: string;
    brand: string;
    model: string;
    year: number | null;
    isEbike: boolean;
    image: string | null;
    color: string | null;
    /** Velikost z katalogu (S/M/L…) nebo výška rámu z artiklu („48 cm"). */
    size: string | null;
    /** Typ rámu (Gent / Trapez / Wave…), pokud ho známe. */
    frameType: string | null;
    capacity: string | null;
    category: string | null;
    qtyDe: number;
    qtyAsi: number;
    /** Už objednáno obchodníky (nezrušené objednávky). */
    ordered: number;
    /** Kusy k objednání = qtyDe + qtyAsi − ordered (min 0). */
    available: number;
    vocCzk: number;
    uvpCzk: number | null;
    mocCzk: number;
    order: number;
}

export async function loadTopAkceSettings(): Promise<TopAkceSettings> {
    const snap = await adminDb.collection('settings').doc('topAkce').get();
    const d = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const rate = Number(d.eurCzk);
    return {
        eurCzk: Number.isFinite(rate) && rate > 0 ? rate : 25,
        published: d.published === true,
        intro: typeof d.intro === 'string' ? d.intro : '',
    };
}

export async function loadActiveItems(): Promise<TopAkceItemDoc[]> {
    const snap = await adminDb.collection(ITEMS).where('active', '==', true).get();
    return snap.docs
        .map(d => d.data() as TopAkceItemDoc)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Součet kusů vázaných TOP AKCE objednávkami podle artiklu: zrušené nic,
 * potvrzené/expedované kusy potvrzené adminem (`confirmedQty`, když
 * potvrzení proběhlo), nové objednané kusy. Stejná logika je v administraci
 * (`biketime/src/lib/orderQty.ts`) — měnit spolu.
 */
export async function loadOrderedCounts(): Promise<Map<string, number>> {
    const snap = await adminDb.collection('orders').where('source', '==', TOP_AKCE_SOURCE).get();
    const counts = new Map<string, number>();
    snap.forEach(doc => {
        const o = doc.data() as {
            status?: string;
            confirmedAt?: string | null;
            items?: { variantId?: string; quantity?: number; confirmedQty?: number | null }[];
        };
        if (o.status === 'cancelled') return;
        const confirmed = (o.status === 'confirmed' || o.status === 'shipped') && !!o.confirmedAt;
        for (const it of o.items || []) {
            const key = String(it.variantId || '');
            if (!key) continue;
            const qty = confirmed && it.confirmedQty != null ? Math.max(0, Number(it.confirmedQty) || 0) : (Number(it.quantity) || 0);
            counts.set(key, (counts.get(key) || 0) + qty);
        }
    });
    return counts;
}

export function sizeLabel(item: Pick<TopAkceItemDoc, 'size' | 'artNr'>): string | null {
    if (item.size) return item.size;
    if (/^\d{12}$/.test(item.artNr)) {
        const cm = Number(item.artNr.slice(10));
        if (cm >= 20 && cm <= 70) return `${cm} cm`;
    }
    return null;
}

export function toPublicItem(doc: TopAkceItemDoc, ordered: number, rate: number): TopAkcePublicItem {
    const total = (Number(doc.qtyDe) || 0) + (Number(doc.qtyAsi) || 0);
    return {
        artNr: doc.artNr,
        groupKey: doc.groupKey || doc.artNr,
        brand: doc.brand,
        model: doc.displayName || doc.name,
        year: doc.year ?? null,
        isEbike: doc.isEbike === true,
        image: doc.image ?? null,
        color: doc.color ?? null,
        size: sizeLabel(doc),
        frameType: doc.frameType ?? null,
        capacity: doc.capacity ?? null,
        category: doc.category ?? null,
        qtyDe: Number(doc.qtyDe) || 0,
        qtyAsi: Number(doc.qtyAsi) || 0,
        ordered,
        available: Math.max(0, total - ordered),
        vocCzk: Math.round(doc.vocEur * rate),
        uvpCzk: doc.uvpEur != null ? Math.round(doc.uvpEur * rate) : null,
        mocCzk: Math.round(doc.mocCzk),
        order: doc.order ?? 0,
    };
}

/** Celá nabídka pro web — položky už s dostupností a CZK cenami. */
export async function loadTopAkceOffer(): Promise<{ settings: TopAkceSettings; items: TopAkcePublicItem[] }> {
    const settings = await loadTopAkceSettings();
    if (!settings.published) return { settings, items: [] };
    const [docs, ordered] = await Promise.all([loadActiveItems(), loadOrderedCounts()]);
    return {
        settings,
        items: docs.map(d => toPublicItem(d, ordered.get(d.artNr) || 0, settings.eurCzk)),
    };
}
