/**
 * Accessory pricing helpers — mirrors how bikes display price.
 *   mocCzk          → retail price incl. VAT (shown to everyone)
 *   priceLevelsCzk  → dealer purchase prices (excl. VAT), shown to logged-in
 *                     shop users only. Accessories carry only A/B (Monkey Link
 *                     price lists have just two dealer tiers).
 */

export type AccessoryLevels = Partial<Record<'A' | 'B' | 'C' | 'D', number | null>>;

const fmt = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

export function formatCzk(n?: number | null): string | null {
  return typeof n === 'number' && n > 0 ? fmt.format(n) : null;
}

/**
 * Whether an accessory has a real price from the Czech price list. Used to hide
 * products that aren't priced from the ceník (e.g. leftover EUR values stuck in
 * mocCzk). A properly-priced accessory has a positive retail MOC AND at least
 * one positive dealer tier (Czech price lists always include A/B).
 */
export function hasValidAccessoryPrice(a: {
  mocCzk?: number | null;
  priceLevelsCzk?: AccessoryLevels;
}): boolean {
  const moc = Number(a.mocCzk);
  const A = Number(a.priceLevelsCzk?.A);
  const B = Number(a.priceLevelsCzk?.B);
  return moc > 0 && (A > 0 || B > 0);
}

/**
 * Dealer price for a given price level. Accessories only have A/B, so C/D
 * users fall back to the best available accessory tier (B, then A).
 */
export function b2bAccessoryPrice(
  levels: AccessoryLevels | undefined,
  level: 'A' | 'B' | 'C' | 'D' | undefined,
): number | null {
  if (!levels || !level) return null;
  const val = levels[level] ?? levels.B ?? levels.A ?? null;
  return typeof val === 'number' && val > 0 ? val : null;
}
