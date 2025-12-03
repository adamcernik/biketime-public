/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { sortSizes, detectCategory, standardizeSize } from '@/lib/size-mapping';

export const dynamic = 'force-dynamic';

// Helper functions adapted from old catalog
const isEbike = (b: any): boolean => {
    // If explicit flag exists
    if (typeof b.isEbike === 'boolean') return b.isEbike;

    const cat = (b.category || '').toLowerCase();
    const spec = b.specs || {};
    const drive = (spec.motor || '').toLowerCase();
    const battery = (spec.battery || spec.capacity || '').toLowerCase();
    const modelName = (b.model || '').toLowerCase();

    return (
        cat.startsWith('e-') ||
        drive.includes('elektro') ||
        drive.includes('bosch') ||
        drive.includes('brose') ||
        drive.includes('shimano') ||
        drive.length > 0 || // If it has a motor specified, it's likely an e-bike
        battery.length > 0 ||
        modelName.startsWith('e-') ||
        modelName.includes('e-stream')
    );
};

const mapRawToTag = (raw: string, isE: boolean): string | null => {
    const r = raw.trim();
    if (!r) return null;
    if (isE) {
        if (r === 'E-ATB Hardtail' || r === 'E-MTB hardtail') return 'Hardtail';
        if (r === 'E-MTB Fully') return 'Celopéra';
        if (r === 'E-SUV Fully / E-ATB Fully') return 'SUV Celopéra';
        if (r === 'E-city / E-trekking' || r === 'Trekking & City') return 'Trekking';
        if (r === 'E-urban') return 'Město';
        if (r === 'E-Gravelbike / E-Cyclocross') return 'Gravel';
        if (r === 'E-youth bike') return 'Mládež';
        return null;
    } else {
        if (r === 'ATB / SUV' || r === 'Cross' || r === 'Cross Street' || r === 'Trekking & City') return 'SUV/Trekking';
        if (r === 'Gravelbike / Cyclocross') return 'Gravel';
        if (r === "Children's bike") return 'Dětské';
        if (r === 'MTB hardtail') return 'Hardtail';
        if (r === 'MTB Fully') return 'Celopéra';
        if (r === 'Racing bike') return 'Silnice';
        if (r === 'Youth bike' || r === 'BMX') return 'Mládež';
        return null;
    }
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '24');

        const searchParam = searchParams.get('search');
        const categoryParam = searchParams.get('category');
        // const brandParam = searchParams.get('brand'); // Removed brand filter
        const yearParam = searchParams.get('year');
        const moseParam = searchParams.get('mose');
        const moheParam = searchParams.get('mohe');
        const ebikeParam = searchParams.get('ebike'); // 'true' | 'false' | null
        const inStockParam = searchParams.get('inStock'); // 'true' | null

        // Fetch priority settings
        const settingsRef = doc(db, 'settings', 'catalog');
        const settingsSnap = await getDoc(settingsRef);
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const ebikeOrder = (settingsData.ebikeModelOrder as string[]) || [];
        const regularOrder = (settingsData.regularModelOrder as string[]) || [];

        const toTitleCase = (str: string) => {
            return str.replace(
                /\w\S*/g,
                (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        };

        const getMoseIndex = (mose: string, isE: boolean) => {
            const order = isE ? ebikeOrder : regularOrder;

            // Try exact match first
            let idx = order.indexOf(mose);

            // If not found, try normalized (Title Case) match as Admin saves it that way
            if (idx === -1 && mose) {
                const normalized = toTitleCase(mose.trim());
                idx = order.indexOf(normalized);
            }

            return idx === -1 ? 9999 : idx;
        };

        const q = collection(db, 'products_v2');

        const snapshot = await getDocs(q);
        let allProducts = snapshot.docs.map(d => {
            const data = d.data();
            const product = { id: d.id, ...data } as any;

            // Enhance product with helpers
            const isE = isEbike(product);
            const rawCategory = product.category || '';
            const mappedCategory = mapRawToTag(rawCategory, isE);

            // Helper to find spec value case-insensitively or by partial key
            const findSpec = (p: any, keyPart: string): string => {
                // 1. Direct property
                if (p[keyPart.toLowerCase()]) return p[keyPart.toLowerCase()];
                if (p[keyPart.toUpperCase()]) return p[keyPart.toUpperCase()];

                // 2. Specs object
                if (!p.specs || typeof p.specs !== 'object') return '';

                // Exact match in specs
                if (p.specs[keyPart]) return p.specs[keyPart];

                // Search in specs keys
                const keys = Object.keys(p.specs);
                const foundKey = keys.find(k => k.toUpperCase().includes(keyPart.toUpperCase()));
                if (foundKey) return p.specs[foundKey];

                return '';
            };

            // Try to find mose (Model Series)
            const mose = product.mose || findSpec(product, 'MOSE') || findSpec(product, 'Model series') || product.specs?.modelSeries || '';

            // Try to find mohe (Engine manufacturer)
            let mohe = product.mohe || findSpec(product, 'MOHE') || findSpec(product, 'Engine manufacturer') || product.specs?.motorManufacturer || '';
            if (mohe === 'FIT') mohe = 'Panasonic';

            // Try to find farf (Color Shopfilter)
            const farf = product.farf || findSpec(product, 'FARF') || findSpec(product, 'Color Shopfilter') || product.specs?.colorShopfilter || '';

            // Stock and Size calculation
            const variants = (product.variants && Array.isArray(product.variants)) ? product.variants : [];
            const sizesSet = new Set<string>();
            const stockSizesSet = new Set<string>();
            const onTheWaySizesSet = new Set<string>();
            let hasStock = false;

            // Determine category for size mapping
            const categoryForSize = detectCategory({ categoryPrgr: product.category, modell: product.model });

            variants.forEach((v: any) => {
                const rawSize = v.size || v.velikost || '';
                const size = standardizeSize(rawSize, categoryForSize);

                if (size) sizesSet.add(size);

                const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                const transit = Number(v.inTransit) || Number(v.onTheWay) || 0;

                if (stock > 0) {
                    hasStock = true;
                    if (size) stockSizesSet.add(size);
                }
                if (transit > 0) {
                    if (size) onTheWaySizesSet.add(size);
                }
            });

            // If no variants with stock, check top level (fallback)
            if (!hasStock && (Number(product.stock) > 0 || Number(product.b2bStockQuantity) > 0)) {
                hasStock = true;
            }

            const sizes = Array.from(sizesSet).sort(sortSizes);
            const stockSizes = Array.from(stockSizesSet);
            const onTheWaySizes = Array.from(onTheWaySizesSet);

            return {
                ...product,
                isEbike: isE,
                originalCategory: rawCategory,
                category: mappedCategory || rawCategory, // Use mapped category for display and filtering
                mose,
                mohe,
                farf,
                hasStock,
                sizes,
                stockSizes,
                onTheWaySizes,
                variants // Keep variants for expansion below
            };
        });

        // **NEW: Expand products to show each in-stock color variant as a separate card**
        const expandedProducts: any[] = [];

        allProducts.forEach(product => {
            if (!product.variants || !Array.isArray(product.variants)) {
                // No variants, keep as is
                expandedProducts.push(product);
                return;
            }

            // Group variants by color and check stock
            const colorGroups = new Map<string, any[]>();
            product.variants.forEach((v: any) => {
                const color = v.color || 'No Color';
                if (!colorGroups.has(color)) {
                    colorGroups.set(color, []);
                }
                colorGroups.get(color)!.push(v);
            });

            // Find which colors have stock
            const colorsWithStock: string[] = [];
            colorGroups.forEach((variants, color) => {
                const hasStockInColor = variants.some((v: any) => {
                    const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                    return stock > 0;
                });
                if (hasStockInColor) {
                    colorsWithStock.push(color);
                }
            });

            if (colorsWithStock.length === 0) {
                // No stock in any color, show original product (first variant's image)
                expandedProducts.push(product);
            } else if (colorsWithStock.length === 1) {
                // Only one color in stock, show that variant
                const stockColor = colorsWithStock[0];
                const colorVariants = colorGroups.get(stockColor)!;
                const firstVariant = colorVariants[0];

                expandedProducts.push({
                    ...product,
                    // Override with variant-specific data
                    primaryImage: firstVariant.images?.[0] || product.images?.[0],
                    primaryColor: stockColor,
                    primaryVariantId: firstVariant.id,
                    _isExpanded: true,
                    _displayColor: stockColor
                });
            } else {
                // Multiple colors in stock - create separate entries for each
                colorsWithStock.forEach(stockColor => {
                    const colorVariants = colorGroups.get(stockColor)!;
                    const firstVariant = colorVariants[0];

                    expandedProducts.push({
                        ...product,
                        // Override with variant-specific data
                        primaryImage: firstVariant.images?.[0] || product.images?.[0],
                        primaryColor: stockColor,
                        primaryVariantId: firstVariant.id,
                        _isExpanded: true,
                        _displayColor: stockColor,
                        // Keep original product ID for detail page lookup
                        // The ProductCardV2 will use primaryVariantId for linking if available
                    });
                });
            }
        });

        // Replace allProducts with expandedProducts for filtering
        allProducts = expandedProducts;

        // 1. Apply Base Filters (E-bike & Stock)
        // These filters determine the "Universe" of options available
        let baseProducts = allProducts;

        if (ebikeParam === 'true') {
            baseProducts = baseProducts.filter(p => p.isEbike);
        } else if (ebikeParam === 'false') {
            baseProducts = baseProducts.filter(p => !p.isEbike);
        }

        if (inStockParam === 'true') {
            baseProducts = baseProducts.filter(p => p.hasStock);
        }

        // Rule: Hide 2022-2024 models if they are not in stock
        // We want to keep the catalog fresh, so older models are only visible if we actually have them.
        baseProducts = baseProducts.filter(p => {
            const y = Number(p.year);
            if (y >= 2022 && y <= 2024) {
                return p.hasStock;
            }
            return true;
        });

        // 2. Extract Options from Base Set
        const categories = Array.from(new Set(baseProducts.map(p => p.category).filter(Boolean))).sort();
        // brands removed
        const years = Array.from(new Set(baseProducts.map(p => p.year).filter(Boolean))).sort((a: any, b: any) => b - a);
        const moseOptions = Array.from(new Set(baseProducts.map(p => p.mose).filter(Boolean))).sort();
        const moheOptions = Array.from(new Set(baseProducts.map(p => p.mohe).filter(Boolean))).sort();

        // Extract all available sizes (standardized)
        const allSizes = new Set<string>();
        baseProducts.forEach(p => {
            const list = inStockParam === 'true' ? p.stockSizes : p.sizes;
            list.forEach((s: string) => allSizes.add(s));
        });
        const sizeOptions = Array.from(allSizes).sort(sortSizes);

        // 3. Apply Selection Filters (Category, Year, Mose, Search)
        let filteredProducts = baseProducts;

        if (searchParam) {
            const s = searchParam.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                const brand = (p.brand || '').toLowerCase();
                const model = (p.model || '').toLowerCase();
                const nrLf = (p.nrLf || '').toLowerCase(); // assuming nrLf exists
                const category = (p.category || '').toLowerCase();

                // Check if any variant matches the search code (nrLf, lfSn, id, ean)
                const hasMatchingVariant = p.variants && Array.isArray(p.variants)
                    ? p.variants.some((v: any) => {
                        const code1 = (v.nrLf || '').toLowerCase();
                        const code2 = (v.lfSn || '').toLowerCase();
                        const code3 = (v.id || '').toLowerCase();
                        const code4 = (v.ean || '').toLowerCase();
                        return code1.includes(s) || code2.includes(s) || code3.includes(s) || code4.includes(s);
                    })
                    : false;

                return brand.includes(s) ||
                    model.includes(s) ||
                    nrLf.includes(s) ||
                    category.includes(s) ||
                    hasMatchingVariant;
            });
        }

        if (categoryParam) {
            filteredProducts = filteredProducts.filter(p => p.category === categoryParam);
        }

        if (yearParam) {
            filteredProducts = filteredProducts.filter(p => p.year === parseInt(yearParam));
        }

        if (moseParam) {
            filteredProducts = filteredProducts.filter(p => (p.mose || '').toLowerCase() === moseParam.toLowerCase());
        }

        if (moheParam) {
            filteredProducts = filteredProducts.filter(p => (p.mohe || '').toLowerCase() === moheParam.toLowerCase());
        }

        // Size Filter
        const sizeParam = searchParams.get('size');
        if (sizeParam) {
            filteredProducts = filteredProducts.filter(p => {
                // Check if the product has the selected size in its standardized sizes list
                // If inStockOnly is true, we should check stockSizes, otherwise sizes
                const targetList = inStockParam === 'true' ? p.stockSizes : p.sizes;
                return targetList.includes(sizeParam);
            });
        }

        // Sort by Priority (Model Series), then Year (desc), then Brand, then Model
        filteredProducts.sort((a, b) => {
            // 1. Model Series Priority
            const idxA = getMoseIndex(a.mose || '', a.isEbike);
            const idxB = getMoseIndex(b.mose || '', b.isEbike);
            if (idxA !== idxB) return idxA - idxB;

            // 2. Year (desc)
            if (b.year !== a.year) return b.year - a.year;

            // 3. Brand (asc)
            if (a.brand !== b.brand) return (a.brand || '').localeCompare(b.brand || '');

            // 4. Model (asc)
            return (a.model || '').localeCompare(b.model || '');
        });

        // Pagination
        const total = filteredProducts.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const paginatedProducts = filteredProducts.slice(start, start + pageSize);

        return NextResponse.json({
            products: paginatedProducts,
            pagination: {
                total,
                page,
                pageSize,
                totalPages
            },
            filters: {
                categories,
                // brands,
                years,
                moseOptions,
                moheOptions,
                sizeOptions
            }
        });

    } catch (error) {
        console.error('Catalog V2 Error:', error);
        return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
}
