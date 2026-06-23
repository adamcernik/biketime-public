/**
 * Fields that must never leave the server on public API responses
 * (wholesale/purchase prices imported from B2B feeds).
 */
const SENSITIVE_FIELDS = new Set(['ekPl', 'uvpPl', 'uavpPl', 'vocCzk', 'ek', 'ekCzk']);

/**
 * Recursively removes sensitive fields from a response payload
 * (objects, arrays of objects, nested variants, specs, ...).
 */
export function stripSensitiveFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key)) continue;
      result[key] = stripSensitiveFields(val);
    }
    return result as T;
  }
  return value;
}

/**
 * Dealer (B2B) selling-price fields. Shown only to logged-in approved shop
 * users — stripped from anonymous/public responses so dealer pricing is never
 * exposed to the public (or to shared CDN caches).
 */
const B2B_PRICE_FIELDS = new Set(['priceLevelsCzk', 'manualB2BPrice', 'b2bPrice', 'katA', 'katB']);

/** Recursively removes dealer/B2B selling-price fields from a payload. */
export function stripB2BPrices<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripB2BPrices(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (B2B_PRICE_FIELDS.has(key)) continue;
      result[key] = stripB2BPrices(val);
    }
    return result as T;
  }
  return value;
}

/** Clamps a query-string integer to a sane range, with NaN fallback. */
export function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const parsed = parseInt(raw ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
