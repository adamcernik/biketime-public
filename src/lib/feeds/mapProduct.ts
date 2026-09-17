/* eslint-disable @typescript-eslint/no-explicit-any */
import { dealerPriceForMoc } from '@/lib/b2bPrice';
import { variantAvailability, variantStockCount, AVAILABILITY_LABELS, VariantAvailabilityState } from '@/lib/availability';
import { isEbikeProduct, mapRawToTag } from '@/lib/catalogMapping';
import { standardizeSize, detectCategory } from '@/lib/size-mapping';

// Jádro partnerského feedu: products_v2 → položky (1 položka = 1 varianta).
//
// BEZPEČNOST: položka se skládá VÝHRADNĚ z vyjmenovaných polí (allowlist) —
// nákupní ceny (ekPl/uvpPl/vocCzk) ani celý ceník hladin (priceLevelsCzk) se
// do výstupu nemohou dostat, protože se nikdy nekopíruje celý dokument.
// Hlídá to test v mapProduct.test.ts.

export type FeedPriceLevel = 'A' | 'B' | 'C' | 'D';

export interface FeedItem {
    /** Kód varianty (artikl ZEG) — párovací klíč */
    itemId: string;
    productId: string;
    ean?: string;
    brand: string;
    model: string;
    /** Složený název: značka, model, ročník, barva, velikost */
    name: string;
    year: number;
    category: string;
    isEbike: boolean;
    color?: string;
    size?: string;
    /** Kapacita baterie (Wh) u e-kol */
    capacity?: string;
    /** Odkaz na detail produktu na biketime.cz */
    url: string;
    /** URL obrázků (ZEG CDN) */
    images: string[];
    /** Doporučená MOC v Kč s DPH */
    mocCzkVat: number | null;
    /** Dealerská VOC v Kč bez DPH pro hladinu partnera */
    vocCzk: number | null;
    /** Stav dostupnosti (kód) */
    availability: VariantAvailabilityState;
    /** Stav dostupnosti (český popisek) */
    availabilityText: string;
    /** Technické parametry (název → hodnota) */
    params: Record<string, string>;
}

export interface FeedFilters {
    /** 'all' = vše, 'ebike' = jen e-kola, 'bike' = jen kola bez motoru */
    ebike: 'all' | 'ebike' | 'bike';
    /** Jen položky, které lze objednat (skladem / u výrobce / na objednávku) */
    onlyAvailable: boolean;
}

export const DEFAULT_FEED_FILTERS: FeedFilters = { ebike: 'all', onlyAvailable: false };

/**
 * Stejné pravidlo čerstvosti jako veřejný katalog (/api/catalog): ročníky
 * 2022–2024 jen pokud je máme skladem nebo na objednávku.
 */
export function isProductFeedVisible(p: Record<string, any>): boolean {
    const y = Number(p.year);
    if (!(y >= 2022 && y <= 2024)) return true;
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const hasStock = variants.some((v) => variantStockCount(v) > 0)
        || Number(p.stock) > 0 || Number(p.b2bStockQuantity) > 0;
    const isOnOrder = variants.some((v) => v?.b2bOrderStatus === 'na_objednavku')
        || p.b2bOrderStatus === 'na_objednavku';
    return hasStock || isOnOrder;
}

const SITE_URL = 'https://biketime.cz';
const MAX_IMAGES = 6;

/** Technické parametry ze specs — jen řetězcové hodnoty, bez prázdných. */
function pickParams(specs: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (specs && typeof specs === 'object') {
        for (const [key, val] of Object.entries(specs as Record<string, unknown>)) {
            if (typeof val === 'string' && val.trim()) out[key] = val.trim();
            else if (typeof val === 'number') out[key] = String(val);
        }
    }
    return out;
}

/**
 * Převede jeden produkt na položky feedu (per varianta) pro danou hladinu.
 * VOC priorita shodná s ceníkem a objednávkami:
 * variant.b2bPrice > manualB2BPrice/b2bPrice produktu > dealerPriceForMoc.
 */
export function mapProductToFeedItems(
    productId: string,
    p: Record<string, any>,
    level: FeedPriceLevel,
): FeedItem[] {
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    if (variants.length === 0) return [];

    const brand = String(p.brand || '');
    const model = String(p.model || '');
    const year = Number(p.year) || 0;
    const isE = isEbikeProduct(p);
    const category = mapRawToTag(String(p.category || ''), isE) || String(p.category || '');
    const sizeCategory = detectCategory({ categoryPrgr: p.category, modell: p.model });
    const params = pickParams(p.specs);
    const url = `${SITE_URL}/catalog/${productId}`;
    const rootManual = Number(p.manualB2BPrice) || Number(p.b2bPrice) || 0;
    const productImages: string[] = Array.isArray(p.images) ? p.images.filter((i: any) => typeof i === 'string') : [];

    const items: FeedItem[] = [];
    for (const v of variants) {
        if (v?.id === undefined || v?.id === null) continue;

        const size = standardizeSize(String(v.size || ''), sizeCategory) || String(v.size || '');
        const color = String(v.color || '').trim();
        const capacity = String(v.capacity || '').trim();
        const moc = Number(v.price) > 0 ? Number(v.price) : null;

        let voc: number | null = dealerPriceForMoc(p, level, moc);
        const variantB2b = Number(v.b2bPrice) || 0;
        if (variantB2b > 0) voc = variantB2b;
        else if (rootManual > 0) voc = rootManual;
        if (voc != null) voc = Math.round(voc);

        const variantImages: string[] = Array.isArray(v.images) ? v.images.filter((i: any) => typeof i === 'string') : [];
        const images = (variantImages.length > 0 ? variantImages : productImages).slice(0, MAX_IMAGES);

        const availability = variantAvailability(p, v);

        items.push({
            itemId: String(v.id),
            productId,
            ean: v.ean ? String(v.ean) : undefined,
            brand,
            model,
            name: [brand, model, year || '', color, capacity && `${capacity} Wh`, size && `vel. ${size}`]
                .filter(Boolean).join(' '),
            year,
            category,
            isEbike: isE,
            color: color || undefined,
            size: size || undefined,
            capacity: capacity || undefined,
            url,
            images,
            mocCzkVat: moc,
            vocCzk: voc,
            availability,
            availabilityText: AVAILABILITY_LABELS[availability],
            params,
        });
    }
    return items;
}

/** Aplikuje partnerova uložená nastavení feedu. */
export function applyFeedFilters(items: FeedItem[], filters: FeedFilters): FeedItem[] {
    return items.filter((i) => {
        if (filters.ebike === 'ebike' && !i.isEbike) return false;
        if (filters.ebike === 'bike' && i.isEbike) return false;
        if (filters.onlyAvailable && i.availability === 'none') return false;
        return true;
    });
}
