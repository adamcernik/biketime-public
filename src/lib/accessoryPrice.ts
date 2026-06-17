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
