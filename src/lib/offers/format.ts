import type { Offer, OfferItem, OfferItemSize } from '@/types/Offer';
import { DEFAULT_EUR_TO_CZK } from '@/types/Offer';

/** Convert an EUR amount to CZK using the offer's static rate, rounded to whole Kč. */
export function eurToCzk(eur: number, rate: number = DEFAULT_EUR_TO_CZK): number {
  return Math.round(eur * (rate || DEFAULT_EUR_TO_CZK));
}

const eurFmt = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const czkFmt = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

export function formatEur(eur: number): string {
  return eurFmt.format(eur);
}

export function formatCzk(czk: number): string {
  return czkFmt.format(czk);
}

/** Czech date, e.g. "15. 6. 2026". Accepts ISO yyyy-mm-dd or full ISO. */
export function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' }).format(d);
}

/**
 * Extract the size code from a full NRLF — the last two digits, per Biketime's
 * coding (e.g. `524901320444` → "44"). Returns null if it can't be parsed.
 */
export function sizeFromNrLf(nrLf?: string): string | null {
  if (!nrLf) return null;
  const digits = nrLf.replace(/\D/g, '');
  if (digits.length < 2) return null;
  return digits.slice(-2);
}

/** The effective EUR price for a size: its override, else the item price. */
export function sizePriceEur(item: OfferItem, size: OfferItemSize): number {
  return typeof size.priceEur === 'number' ? size.priceEur : item.priceEur;
}

/**
 * True when every size shares the item-level price — lets the UI show a single
 * price for the line instead of a price per size.
 */
export function hasUniformPrice(item: OfferItem): boolean {
  return item.sizes.every(
    (s) => typeof s.priceEur !== 'number' || s.priceEur === item.priceEur,
  );
}

/** True when at least one size carries its own battery value. */
export function hasPerSizeBattery(item: OfferItem): boolean {
  return item.sizes.some((s) => !!s.battery);
}

/** The effective battery for a size: its override, else the item battery. */
export function sizeBattery(item: OfferItem, size: OfferItemSize): string | undefined {
  return size.battery || item.battery;
}

/**
 * Whether to render the per-size detail table instead of a single price +
 * size chips: when prices differ by size, or battery differs by size.
 */
export function showSizeTable(item: OfferItem): boolean {
  return !hasUniformPrice(item) || hasPerSizeBattery(item);
}

/** Lowest EUR price across an item's sizes (for "od …" display). */
export function minItemPriceEur(item: OfferItem): number {
  if (!item.sizes.length) return item.priceEur;
  return Math.min(...item.sizes.map((s) => sizePriceEur(item, s)));
}

/** Sizes as a compact label, e.g. "40, 44, 48 (12 ks), 52". */
export function sizesLabel(item: OfferItem): string {
  return item.sizes
    .map((s) => (s.quantity ? `${s.size} (${s.quantity} ks)` : s.size))
    .join(', ');
}

/** Basic guard that an unknown object looks like a stored Offer. */
export function isOffer(value: unknown): value is Offer {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.id === 'string' && Array.isArray(o.items);
}
