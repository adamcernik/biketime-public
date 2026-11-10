import 'server-only';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Whether a product may be shown publicly on its detail page/API.
 *
 * Products flagged `catalogHidden` in admin (Sklad / detail produktu) are never
 * shown — list, detail, feeds and sitemap all gate on the same flag.
 *
 * Regular products: always. Preorder-only products (e.g. model year 2027,
 * imported without prices): only while the preorder section is open AND the
 * product is in the admin-curated settings/preorders list — otherwise the
 * bike must not appear anywhere on the public web (direct links included),
 * because it has no prices yet.
 */
/** Admin "Skrýt z katalogu": the whole product stays out of the public web. */
export function isCatalogHidden(productData: Record<string, unknown> | undefined): boolean {
  return productData?.catalogHidden === true;
}

export async function isProductPubliclyVisible(
  productId: string,
  productData: Record<string, unknown> | undefined,
): Promise<boolean> {
  if (isCatalogHidden(productData)) return false;
  if (productData?.preorderOnly !== true) return true;

  const snap = await adminDb.collection('settings').doc('preorders').get();
  if (!snap.exists) return false;
  const enabled = snap.get('enabled') === true;
  const ids: unknown = snap.get('productIds');
  return enabled && Array.isArray(ids) && ids.includes(productId);
}
