/**
 * Standalone migration script: propagate b2bOrderStatus from `bikes` to `products_v2`
 *
 * Usage:
 *   # Option 1: Base64-encoded service account
 *   FIREBASE_SERVICE_ACCOUNT_BASE64="..." node scripts/migrate-order-status.mjs
 *
 *   # Option 2: JSON service account file path
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccount.json" node scripts/migrate-order-status.mjs
 *
 *   # Dry run (preview only, no writes):
 *   DRY_RUN=true FIREBASE_SERVICE_ACCOUNT_BASE64="..." node scripts/migrate-order-status.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- Init Firebase Admin ---
function initAdmin() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const buf = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64');
        const sa = JSON.parse(buf.toString('utf-8'));
        return initializeApp({ credential: cert(sa) });
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        return initializeApp({ credential: cert(sa) });
    }
    // Fallback: GOOGLE_APPLICATION_CREDENTIALS env var (default credentials)
    return initializeApp();
}

const app = initAdmin();
const db = getFirestore(app);
const dryRun = process.env.DRY_RUN === 'true';

console.log(`[migrate-order-status] Starting. dryRun=${dryRun}\n`);

// 1. Read all bikes with b2bOrderStatus === 'na_objednavku'
const bikesSnap = await db
    .collection('bikes')
    .where('b2bOrderStatus', '==', 'na_objednavku')
    .get();

const orderStatusMap = new Map();
bikesSnap.forEach(doc => {
    const data = doc.data();
    const nrLf = data.nrLf || doc.id;
    if (nrLf) orderStatusMap.set(nrLf, 'na_objednavku');
    if (data.lfSn) orderStatusMap.set(data.lfSn, 'na_objednavku');
});

console.log(`Found ${bikesSnap.size} bikes with b2bOrderStatus=na_objednavku`);
console.log(`Mapped ${orderStatusMap.size} identifiers (nrLf + lfSn)\n`);

if (orderStatusMap.size === 0) {
    console.log('Nothing to migrate. Exiting.');
    process.exit(0);
}

// 2. Read all products_v2
const productsSnap = await db.collection('products_v2').get();
console.log(`Loaded ${productsSnap.size} products from products_v2\n`);

let productsUpdated = 0;
let totalVariantsMatched = 0;
const errors = [];

// 3. Match and update
for (const productDoc of productsSnap.docs) {
    const product = productDoc.data();
    const variants = product.variants;
    if (!variants || !Array.isArray(variants)) continue;

    let productChanged = false;
    const updatedVariants = variants.map(v => {
        const variantNrLf = v.nrLf || v.id || '';
        const variantEan = v.ean || '';

        const status = orderStatusMap.get(variantNrLf) ||
                       (variantEan ? orderStatusMap.get(variantEan) : undefined);

        if (status && v.b2bOrderStatus !== status) {
            productChanged = true;
            totalVariantsMatched++;
            return { ...v, b2bOrderStatus: status };
        }
        return v;
    });

    if (productChanged) {
        const onOrderSizes = updatedVariants
            .filter(v => v.b2bOrderStatus === 'na_objednavku')
            .map(v => v.size)
            .filter(Boolean);

        const stockSizes = updatedVariants
            .filter(v => {
                const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                return stock > 0;
            })
            .map(v => v.size)
            .filter(Boolean);

        const hasStock = stockSizes.length > 0;
        const isOnOrder = onOrderSizes.length > 0;

        const title = `${product.brand || ''} ${product.model || ''}`.trim();
        const matchedCount = updatedVariants.filter(v => v.b2bOrderStatus === 'na_objednavku').length;

        if (dryRun) {
            console.log(`  [DRY] ${productDoc.id} — ${title} — ${matchedCount} variant(s) → onOrderSizes: [${onOrderSizes.join(', ')}]`);
        } else {
            try {
                await db.collection('products_v2').doc(productDoc.id).update({
                    variants: updatedVariants,
                    onOrderSizes,
                    stockSizes,
                    hasStock,
                    b2bOrderStatus: isOnOrder ? 'na_objednavku' : '',
                });
                console.log(`  [OK] ${productDoc.id} — ${title} — ${matchedCount} variant(s)`);
            } catch (err) {
                console.error(`  [ERR] ${productDoc.id} — ${title}:`, err.message);
                errors.push(productDoc.id);
            }
        }
        productsUpdated++;
    }
}

// 4. Summary
console.log(`\n--- Summary ---`);
console.log(`Bikes with na_objednavku: ${bikesSnap.size}`);
console.log(`Products updated: ${productsUpdated}`);
console.log(`Variants matched: ${totalVariantsMatched}`);
if (errors.length > 0) {
    console.log(`Errors: ${errors.length} (${errors.join(', ')})`);
}
if (dryRun) {
    console.log(`\n⚠️  This was a DRY RUN. No data was written.`);
    console.log(`    Run without DRY_RUN=true to apply changes.`);
}

process.exit(errors.length > 0 ? 1 : 0);
