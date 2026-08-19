// Jednotné pravidlo dostupnosti varianty — používá ho detail produktu (chipy,
// tlačítko košíku) i server při přijetí objednávky (/api/orders), aby UI nikdy
// neslibovalo něco jiného, než co objednávka pustí.
//
// Precedence: náš sklad > ZEG feed (autoritativní pro aktuální sortiment
// výrobce — vč. definitivního „vyprodáno") > admin status na_objednavku
// (fallback pro zboží mimo feed, typicky starší ročníky).

export type VariantAvailabilityState =
    | 'ours'       // skladem u nás
    | 'zeg-stock'  // u výrobce skladem
    | 'zeg-low'    // u výrobce omezeně
    | 'zeg-date'   // u výrobce od budoucího týdne
    | 'on-order'   // na objednávku (admin status, mimo ZEG feed)
    | 'none';      // nedostupné

interface VariantLike {
    id?: string | number;
    stock?: number | null;
    onHand?: number | null;
    qty?: number | null;
    b2bStockQuantity?: number | null;
    b2bOrderStatus?: string | null;
}

interface ProductLike {
    zeg?: {
        variants?: Record<string, { s: number; kw: number }>;
    };
}

export function variantStockCount(variant: VariantLike): number {
    return Number(variant.stock) || Number(variant.onHand) || Number(variant.qty) || Number(variant.b2bStockQuantity) || 0;
}

export function variantAvailability(product: ProductLike, variant: VariantLike): VariantAvailabilityState {
    if (variantStockCount(variant) > 0) return 'ours';

    const z = variant.id != null ? product.zeg?.variants?.[String(variant.id)] : undefined;
    if (z) {
        if (z.s === 2) return 'zeg-stock';
        if (z.s === 1) return 'zeg-low';
        if (z.kw > 0) return 'zeg-date';
        return 'none'; // ve feedu, ale vyprodáno bez termínu — ZEG je autoritativní
    }

    if (variant.b2bOrderStatus === 'na_objednavku') return 'on-order';
    return 'none';
}

/** Lze variantu objednat (vložit do košíku / přijmout v objednávce)? */
export function isVariantOrderable(product: ProductLike, variant: VariantLike): boolean {
    return variantAvailability(product, variant) !== 'none';
}
