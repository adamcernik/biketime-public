/**
 * Dealer (VOC) price helper.
 *
 * Catalog stores ONE product-level `priceLevelsCzk` (A–D) even though retail
 * (variant.price / MOC) differs by capacity/size. Dealer prices are a fixed
 * percentage of MOC (supplier formula; e.g. A = MOC × ~0.6357), and the stored
 * level corresponds to ONE variant's MOC (the "anchor"). So to make VOC track
 * the selected variant like MOC does, scale the stored level by
 * (selectedMoc / anchorMoc).
 */

/** Supplier category-A coefficient (A ≈ MOC × this). Only used to identify which
 *  variant the stored levels were derived from — the displayed value uses the
 *  product's own ratio, so this stays correct even if the coefficient drifts. */
const DEALER_A_RATIO = 0.6357;

type Level = 'A' | 'B' | 'C' | 'D';

interface PricingVariant {
  price?: number | null;
  b2bPrice?: number | null;
}

interface PricingProduct {
  priceLevelsCzk?: Partial<Record<Level, number | null>>;
  minPrice?: number;
  maxPrice?: number;
  manualB2BPrice?: number | null;
  b2bPrice?: number | null;
  variants?: PricingVariant[];
}

/** The MOC the stored dealer levels were derived from (the anchor variant). */
function anchorMoc(product: PricingProduct): number {
  const prices = (product.variants ?? [])
    .map((v) => Number(v.price))
    .filter((p) => p > 0);
  const anchorA = Number(product.priceLevelsCzk?.A) || 0;
  if (anchorA > 0 && prices.length) {
    const est = anchorA / DEALER_A_RATIO;
    return prices.reduce((best, p) => (Math.abs(p - est) < Math.abs(best - est) ? p : best), prices[0]);
  }
  return Number(product.maxPrice) || (prices.length ? Math.max(...prices) : 0);
}

/**
 * Dealer price for a given price level, scaled to `currentMoc` (the retail price
 * of the currently selected variant). Returns null if no level is available.
 */
export function dealerPriceForMoc(
  product: PricingProduct,
  level: Level | undefined,
  currentMoc: number | undefined | null,
): number | null {
  if (!level) return null;
  // Season 2027 ceník has only kategorie A–C (order-volume based) while
  // dealers may still hold legacy level D — fall back to kategorie A (the
  // base "bez předobjednávky" price) when the user's level is absent.
  const base = Number(product.priceLevelsCzk?.[level]) || Number(product.priceLevelsCzk?.A) || 0;
  if (base <= 0) return null;
  const moc = Number(currentMoc);
  if (!(moc > 0)) return base;
  const anchor = anchorMoc(product);
  if (!(anchor > 0)) return base;
  return Math.round((base * moc) / anchor);
}

/**
 * Dealer price for ONE concrete variant. A manual (akční) price belongs only
 * to the variant it was set on — never to its siblings (a 600 Wh sale price
 * must not show on the 800 Wh bike). Product-level manualB2BPrice is just a
 * mirror (max of variant prices) kept for legacy documents; it applies only
 * when no variant in the product carries its own b2bPrice.
 */
export function variantDealerPrice(
  product: PricingProduct,
  variant: PricingVariant | undefined | null,
  level: Level | undefined,
): number | null {
  const own = Number(variant?.b2bPrice) || 0;
  if (own > 0) return own;
  const anyVariantManual = (product.variants ?? []).some((v) => (Number(v.b2bPrice) || 0) > 0);
  const rootManual = Number(product.manualB2BPrice) || Number(product.b2bPrice) || 0;
  if (!anyVariantManual && rootManual > 0) return rootManual;
  return dealerPriceForMoc(product, level, Number(variant?.price) || null);
}
