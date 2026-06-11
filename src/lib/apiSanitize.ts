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

/** Clamps a query-string integer to a sane range, with NaN fallback. */
export function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const parsed = parseInt(raw ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
