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

interface PricingProduct {
  priceLevelsCzk?: Partial<Record<Level, number | null>>;
  minPrice?: number;
  maxPrice?: number;
  variants?: Array<{ price?: number | null }>;
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
  const base = Number(product.priceLevelsCzk?.[level]) || 0;
  if (base <= 0) return null;
  const moc = Number(currentMoc);
  if (!(moc > 0)) return base;
  const anchor = anchorMoc(product);
  if (!(anchor > 0)) return base;
  return Math.round((base * moc) / anchor);
}
