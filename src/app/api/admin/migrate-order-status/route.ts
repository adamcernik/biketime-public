import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/admin/migrate-order-status
 *
 * Reads b2bOrderStatus from the `bikes` collection and propagates it
 * to matching variants in `products_v2`. This is needed because the
 * backend migration set b2bOrderStatus on `bikes` docs but the frontend
 * catalog reads from `products_v2`.
 *
 * Query params:
 *   ?dryRun=true  — preview changes without writing
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401, headers: corsHeaders }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const dryRun = searchParams.get('dryRun') === 'true';

        console.log(`[migrate-order-status] Starting. dryRun=${dryRun}`);

        // 1. Read all bikes with b2bOrderStatus === 'na_objednavku'
        const bikesSnap = await adminDb
            .collection('bikes')
            .where('b2bOrderStatus', '==', 'na_objednavku')
            .get();

        // Build a map: nrLf -> b2bOrderStatus
        const orderStatusMap = new Map<string, string>();
        bikesSnap.forEach(doc => {
            const data = doc.data();
            const nrLf = data.nrLf || doc.id;
            if (nrLf) {
                orderStatusMap.set(nrLf, 'na_objednavku');
            }
            // Also map by lfSn if available
            if (data.lfSn) {
                orderStatusMap.set(data.lfSn, 'na_objednavku');
            }
        });

        console.log(`[migrate-order-status] Found ${orderStatusMap.size} bikes with na_objednavku`);

        // 2. Read all products_v2
        const productsSnap = await adminDb.collection('products_v2').get();

        interface UpdateResult {
            productId: string;
            productTitle: string;
            matchedVariants: number;
            onOrderSizes: string[];
        }

        const updates: UpdateResult[] = [];
        const errors: string[] = [];
        let totalVariantsMatched = 0;

        // 3. Match and update
        for (const productDoc of productsSnap.docs) {
            const product = productDoc.data();
            const variants = product.variants;
            if (!variants || !Array.isArray(variants)) continue;

            let productChanged = false;
            const updatedVariants = variants.map((v: Record<string, unknown>) => {
                const variantNrLf = (v.nrLf || v.id || '') as string;
                const variantEan = (v.ean || '') as string;

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
                    .filter((v: Record<string, unknown>) => v.b2bOrderStatus === 'na_objednavku')
                    .map((v: Record<string, unknown>) => v.size as string)
                    .filter(Boolean);

                const stockSizes = updatedVariants
                    .filter((v: Record<string, unknown>) => {
                        const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                        return stock > 0;
                    })
                    .map((v: Record<string, unknown>) => v.size as string)
                    .filter(Boolean);

                const hasStock = stockSizes.length > 0;
                const isOnOrder = onOrderSizes.length > 0;

                const updateResult: UpdateResult = {
                    productId: productDoc.id,
                    productTitle: `${product.brand || ''} ${product.model || ''}`.trim(),
                    matchedVariants: updatedVariants.filter((v: Record<string, unknown>) => v.b2bOrderStatus === 'na_objednavku').length,
                    onOrderSizes,
                };
                updates.push(updateResult);

                if (!dryRun) {
                    try {
                        await adminDb.collection('products_v2').doc(productDoc.id).update({
                            variants: updatedVariants,
                            onOrderSizes,
                            stockSizes,
                            hasStock,
                            b2bOrderStatus: isOnOrder ? 'na_objednavku' : '',
                        });
                    } catch (err) {
                        console.error(`[migrate-order-status] Error updating ${productDoc.id}:`, err);
                        errors.push(`Error updating ${productDoc.id}`);
                    }
                }
            }
        }

        console.log(`[migrate-order-status] Done. Products: ${updates.length}, Variants: ${totalVariantsMatched}`);

        return NextResponse.json({
            success: true,
            dryRun,
            bikesWithOrderStatus: orderStatusMap.size,
            productsUpdated: updates.length,
            totalVariantsMatched,
            updates: dryRun ? updates : undefined,
            errors: errors.length > 0 ? errors : undefined,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('[migrate-order-status] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
