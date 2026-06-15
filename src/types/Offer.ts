/**
 * Tailored B2B offer ("Nabídka") types.
 *
 * Design notes
 * ------------
 * Offers are SNAPSHOTS, not live references. When an admin builds an offer they
 * paste NRLF codes; the relevant product data (name, specs, image, sizes) is
 * copied into the offer at creation time. This way a shared offer link/PDF never
 * changes after it is sent, even if the catalog price, stock, image or specs
 * change later. Do not resolve offer items against `products_v2` at view time.
 *
 * Pricing
 * -------
 * Prices are entered primarily in EUR and are **without VAT** (ex-VAT, B2B
 * purchase prices). The EUR→CZK rate is static and stored per offer
 * (`eurToCzk`, default 25) so the converted CZK figure stays reproducible even
 * if the rate is changed for future offers.
 *
 * Sizing
 * ------
 * One bike model usually has several NRLF codes — one per frame size. The last
 * two digits of the NRLF encode the size (e.g. `524901320444` → size 44). The
 * admin pastes one code; sizes for the offer are listed in `OfferItem.sizes`.
 * Price is normally per-bike (`OfferItem.priceEur`), but can be overridden per
 * size (`OfferItemSize.priceEur`) — e.g. kids bikes priced by wheel size.
 */

export type OfferStatus = 'draft' | 'sent' | 'archived';

export interface OfferClient {
  /** Company / shop name. */
  company?: string;
  /** Specific contact person. */
  contactName?: string;
  /** Contact email. */
  email?: string;
}

export interface OfferItemSize {
  /** Display size, e.g. "44", "L", "20". */
  size: string;
  /** Full NRLF code for this exact size variant, if known. */
  nrLf?: string;
  /** Optional available quantity note (e.g. 12 → "12 ks"). */
  quantity?: number;
  /**
   * Per-size purchase price in EUR (ex-VAT). Overrides the item-level price
   * when set. Used for models priced differently per size (e.g. kids bikes).
   */
  priceEur?: number;
  /**
   * Per-size battery / capacity. Overrides the item-level battery when set.
   * Needed for models whose battery differs by size — e.g. kids bikes where
   * each wheel size (20/24/26) is a distinct product with its own battery.
   */
  battery?: string;
  /** Optional free-text note for this size. */
  note?: string;
}

export interface OfferItem {
  /** Stable local id within the offer (for React keys / ordering). */
  id: string;
  /** The NRLF code the admin pasted (base / representative variant). */
  nrLf: string;
  brand?: string;
  /** Model name, e.g. "SONIC AM-SX 1". */
  model: string;
  year?: number;
  color?: string;
  category?: string;
  /** Snapshot of the main product image URL (ZEG CDN, original form). */
  imageUrl?: string;
  /** Public catalog detail URL (for reference / link in offer). */
  catalogUrl?: string;
  /** Headline motor spec (e-bikes). */
  motor?: string;
  /** Headline battery / capacity spec (e-bikes). */
  battery?: string;
  /** A few additional spec lines to show on the card (label → value). */
  specs?: Record<string, string>;
  /** Item-level purchase price in EUR (ex-VAT). Per-size price overrides this. */
  priceEur: number;
  /** Available sizes for this offer line. */
  sizes: OfferItemSize[];
  /** Optional free-text note for the whole line. */
  note?: string;
}

export interface Offer {
  /** Firestore document id — also the unguessable public token in the URL. */
  id: string;
  /** Internal title, e.g. "Nabídka pro Olpran". */
  title?: string;
  client: OfferClient;
  /** Static EUR→CZK rate captured for this offer (default 25). */
  eurToCzk: number;
  /** ISO date string (yyyy-mm-dd); offer validity, set manually per offer. */
  validUntil?: string | null;
  items: OfferItem[];
  status?: OfferStatus;
  /** ISO timestamps. */
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_EUR_TO_CZK = 25;
