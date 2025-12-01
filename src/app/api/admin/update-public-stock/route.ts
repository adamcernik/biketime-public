import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Define interfaces for better type safety
interface StockBike {
    id?: string;
    nrLf?: string;
    ean?: string;
    b2bStockQuantity?: number;
    b2bShipQuantity?: number;
    [key: string]: unknown;
}

interface ProductVariant {
    id?: string;
    nrLf?: string;
    ean?: string;
    size?: string;
    stock?: number;
    inTransit?: number;
    onTheWay?: number;
    onHand?: number;
    qty?: number;
    [key: string]: unknown;
}

interface Product {
    id: string;
    brand?: string;
    model?: string;
    variants?: ProductVariant[];
    [key: string]: unknown;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Replace with specific origin in production if needed
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        console.log('Received stock update request');
        const body = await request.json();
        const { stockData, dryRun } = body;

        console.log(`Processing ${stockData?.length} items. DryRun: ${dryRun}`);

        if (!Array.isArray(stockData)) {
            return NextResponse.json(
                { success: false, error: 'Invalid stockData format' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 1. Fetch all products_v2
        const productsSnapshot = await getDocs(collection(db, 'products_v2'));
        const products: Product[] = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() } as Product);
        });

        // 2. Create a map of stock bikes for faster lookup
        // Key: nrLf (or id if nrLf is missing)
        const stockMap = new Map<string, StockBike>();
        stockData.forEach((bike: StockBike) => {
            if (bike.nrLf) {
                stockMap.set(bike.nrLf, bike);
            }
            // Also map by ID just in case
            if (bike.id) {
                stockMap.set(bike.id, bike);
            }
            // And EAN
            if (bike.ean) {
                stockMap.set(bike.ean, bike);
            }
        });

        interface UpdateRecord {
            productTitle: string;
            variantId: string;
            size?: string;
            oldStock: number;
            newStock: number;
            oldTransit: number;
            newTransit: number;
            productId: string;
        }

        const updates: UpdateRecord[] = [];
        const results: string[] = [];
        const errors: string[] = [];

        // 3. Compare
        for (const product of products) {
            if (!product.variants || !Array.isArray(product.variants)) continue;

            let productChanged = false;
            const updatedVariants = product.variants.map((v: ProductVariant) => {
                // Try to match by nrLf, then id, then ean
                const variantId = v.nrLf || v.id;
                const stockBike = (variantId ? stockMap.get(variantId) : undefined) || (v.ean ? stockMap.get(v.ean) : undefined);

                if (stockBike) {
                    const newStock = stockBike.b2bStockQuantity || 0;
                    const newTransit = stockBike.b2bShipQuantity || 0;

                    const currentStock = v.stock || 0;
                    const currentTransit = v.inTransit || v.onTheWay || 0;

                    if (newStock !== currentStock || newTransit !== currentTransit) {
                        productChanged = true;

                        // Add to updates list for dryRun
                        if (dryRun) {
                            updates.push({
                                productTitle: `${product.brand} ${product.model}`,
                                variantId: variantId,
                                size: v.size,
                                oldStock: currentStock,
                                newStock: newStock,
                                oldTransit: currentTransit,
                                newTransit: newTransit,
                                productId: product.id
                            });
                        }

                        return {
                            ...v,
                            stock: newStock,
                            inTransit: newTransit,
                            // Update legacy fields
                            onHand: newStock,
                            qty: newStock,
                            onTheWay: newTransit
                        };
                    }
                }
                return v;
            });

            if (productChanged && !dryRun) {
                try {
                    // Recalculate top-level fields
                    const stockSizes = updatedVariants
                        .filter((v: ProductVariant) => (v.stock || 0) > 0)
                        .map((v: ProductVariant) => v.size);

                    const onTheWaySizes = updatedVariants
                        .filter((v: ProductVariant) => (v.stock || 0) === 0 && (v.inTransit || 0) > 0)
                        .map((v: ProductVariant) => v.size);

                    const hasStock = stockSizes.length > 0;

                    const productRef = doc(db, 'products_v2', product.id);
                    await updateDoc(productRef, {
                        variants: updatedVariants,
                        stockSizes,
                        onTheWaySizes,
                        hasStock,
                        lastStockUpdate: new Date().toISOString()
                    });
                    results.push(product.id);
                } catch (err) {
                    console.error(`Error updating product ${product.id}:`, err);
                    errors.push(`Error updating product ${product.id}`);
                }
            }
        }

        if (dryRun) {
            return NextResponse.json({ success: true, updates }, { headers: corsHeaders });
        } else {
            return NextResponse.json(
                { success: true, updatedCount: results.length, errors },
                { headers: corsHeaders }
            );
        }

    } catch (error) {
        console.error('Error in update-public-stock:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
