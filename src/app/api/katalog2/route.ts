/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { sortSizes, detectCategory, standardizeSize } from '@/lib/size-mapping';

export const dynamic = 'force-dynamic';

/**
 * Katalog2 API — reads from products_v3 collection
 * Maps ProductV3 data to ProductV2-compatible shape for ProductCardV2
 */

const mapCategory = (raw: string, isE: boolean): string | null => {
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
        const yearParam = searchParams.get('year');
        const brandParam = searchParams.get('brand');
        const ebikeParam = searchParams.get('ebike');
        const sizeParam = searchParams.get('size');
        const wheelSizeParam = searchParams.get('wheelSize');

        // Fetch all products_v3
        const snapshot = await getDocs(collection(db, 'products_v3'));
        let allProducts = snapshot.docs.map(d => {
            const data = d.data();
            const specs = data.specs || {};
            const variants = (data.variants || []) as any[];
            const isE = data.isElectric || false;

            const rawCategory = specs.category || '';
            const mappedCategory = mapCategory(rawCategory, isE) || rawCategory;

            const mose = specs.modelSeries || '';
            const mohe = specs.motorManufacturer || '';

            // Map variants to ProductV2-compatible shape
            const categoryForSize = detectCategory({ categoryPrgr: rawCategory, modell: data.modell });

            const sizesSet = new Set<string>();
            const mappedVariants = variants.map((v: any) => {
                const rawSize = v.rahmenGroesse || v.sizeCode || '';
                const std = standardizeSize(rawSize, categoryForSize);
                if (std) sizesSet.add(std);

                return {
                    id: v.nrLf,
                    nrLf: v.nrLf,
                    ean: v.ean,
                    lfSn: v.lfSn,
                    size: v.rahmenGroesse || v.sizeCode,
                    color: v.farbe,
                    images: v.images || [],
                    // Stock fields (Phase 2 — not set yet, defaults to 0)
                    b2bStockQuantity: v.b2bStockQuantity || 0,
                    b2bOrderStatus: v.b2bOrderStatus || '',
                    // Prices
                    moc: v.moc,
                    priceA: v.priceA,
                    priceB: v.priceB,
                    priceC: v.priceC,
                    priceD: v.priceD,
                };
            });

            const sizes = Array.from(sizesSet).sort(sortSizes);

            // Compute stock status from variant b2bOrderStatus
            const stockSizeSet = new Set<string>();
            const onOrderSizeSet = new Set<string>();
            const transitSizeSet = new Set<string>();
            let hasStock = false;
            let isOnOrder = false;
            let hasTransit = false;

            for (const v of mappedVariants) {
                const size = standardizeSize(v.size || '', categoryForSize);
                if (v.b2bOrderStatus === 'skladem') {
                    hasStock = true;
                    if (size) stockSizeSet.add(size);
                } else if (v.b2bOrderStatus === 'na_ceste') {
                    hasTransit = true;
                    if (size) transitSizeSet.add(size);
                } else if (v.b2bOrderStatus === 'na_objednavku') {
                    isOnOrder = true;
                    if (size) onOrderSizeSet.add(size);
                }
            }

            const stockSizes = Array.from(stockSizeSet).sort(sortSizes);
            const onOrderSizes = Array.from(onOrderSizeSet).sort(sortSizes);
            const transitSizes = Array.from(transitSizeSet).sort(sortSizes);

            // Aggregate b2bOrderStatus (priority: skladem > na_ceste > na_objednavku)
            const aggregateStatus = hasStock ? 'skladem' : hasTransit ? 'na_ceste' : isOnOrder ? 'na_objednavku' : '';

            // Compute price range in CZK
            const mocValues = variants.map((v: any) => v.moc).filter((v: number) => v && v > 0);
            const minPrice = mocValues.length > 0 ? Math.min(...mocValues) : 0;
            const maxPrice = mocValues.length > 0 ? Math.max(...mocValues) : 0;

            // Compute B2B price levels from variants
            const priceLevels: Partial<Record<'A' | 'B' | 'C' | 'D', number>> = {};
            const firstVariantWithPrices = variants.find((v: any) => v.priceC && v.priceC > 0);
            if (firstVariantWithPrices) {
                if (firstVariantWithPrices.priceA) priceLevels.A = firstVariantWithPrices.priceA;
                if (firstVariantWithPrices.priceB) priceLevels.B = firstVariantWithPrices.priceB;
                if (firstVariantWithPrices.priceC) priceLevels.C = firstVariantWithPrices.priceC;
                if (firstVariantWithPrices.priceD) priceLevels.D = firstVariantWithPrices.priceD;
            }

            // Use EUR UVP as fallback price if no MOC set
            const uvpValues = variants.map((v: any) => v.uvpPl).filter((v: number) => v && v > 0);
            const displayMinPrice = minPrice > 0 ? minPrice : (uvpValues.length > 0 ? Math.min(...uvpValues) : 0);
            const displayMaxPrice = maxPrice > 0 ? maxPrice : (uvpValues.length > 0 ? Math.max(...uvpValues) : 0);

            return {
                id: d.id,
                brand: data.marke || '',
                model: data.modell || '',
                year: data.modelljahr || 0,
                category: mappedCategory,
                originalCategory: rawCategory,
                isEbike: isE,
                mose,
                mohe,
                farf: specs.colorShopfilter || '',
                images: data.primaryImage ? [data.primaryImage] : (variants[0]?.images || []),
                primaryImage: data.primaryImage,
                variants: mappedVariants,
                specs: {
                    motor: specs.motor || '',
                    battery: specs.battery || '',
                    capacity: specs.batteryCapacity || '',
                    frameMaterial: specs.frameMaterial || '',
                    wheelSize: specs.wheelSize || '',
                },
                sizes,
                stockSizes,
                onOrderSizes,
                transitSizes,
                hasStock,
                isOnOrder: !hasStock && isOnOrder,
                b2bOrderStatus: aggregateStatus,
                minPrice: displayMinPrice,
                maxPrice: displayMaxPrice,
                priceLevelsCzk: Object.keys(priceLevels).length > 0 ? priceLevels : undefined,
                variantCount: data.variantCount || variants.length,
                colors: data.colors || [],
                slug: data.slug || '',
            };
        });

        // Filter: only active products
        allProducts = allProducts.filter(p => p.year > 0);

        // E-bike filter
        if (ebikeParam === 'true') {
            allProducts = allProducts.filter(p => p.isEbike);
        } else if (ebikeParam === 'false') {
            allProducts = allProducts.filter(p => !p.isEbike);
        }

        // Extract filter options from full set (before other filters)
        const categories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))).sort();
        const years = Array.from(new Set(allProducts.map(p => p.year).filter(Boolean))).sort((a: number, b: number) => b - a);
        const brands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean))).sort();
        const moseOptions = Array.from(new Set(allProducts.map(p => p.mose).filter(Boolean))).sort();
        const moheOptions = Array.from(new Set(allProducts.map(p => p.mohe).filter(Boolean))).sort();

        const allWheelSizes = new Set<string>();
        allProducts.forEach(p => {
            const ws = p.specs.wheelSize;
            if (ws && ws.trim()) {
                const match = ws.match(/([\d.]+)/);
                if (match) allWheelSizes.add(match[1]);
            }
        });
        const wheelSizeOptions = Array.from(allWheelSizes).sort((a, b) => parseFloat(a) - parseFloat(b));

        const allSizes = new Set<string>();
        allProducts.forEach(p => p.sizes.forEach((s: string) => allSizes.add(s)));
        const sizeOptions = Array.from(allSizes).sort(sortSizes);

        // Apply filters
        let filteredProducts = allProducts;

        if (searchParam) {
            const s = searchParam.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                const brand = p.brand.toLowerCase();
                const model = p.model.toLowerCase();
                const category = p.category.toLowerCase();
                const hasMatchingVariant = p.variants.some((v: any) =>
                    (v.nrLf || '').toLowerCase().includes(s) ||
                    (v.ean || '').toLowerCase().includes(s)
                );
                return brand.includes(s) || model.includes(s) || category.includes(s) || hasMatchingVariant;
            });
        }

        if (categoryParam) {
            filteredProducts = filteredProducts.filter(p => p.category === categoryParam);
        }

        if (yearParam) {
            filteredProducts = filteredProducts.filter(p => p.year === parseInt(yearParam));
        }

        if (brandParam) {
            filteredProducts = filteredProducts.filter(p => p.brand.toLowerCase() === brandParam.toLowerCase());
        }

        if (sizeParam) {
            filteredProducts = filteredProducts.filter(p => p.sizes.includes(sizeParam));
        }

        if (wheelSizeParam) {
            filteredProducts = filteredProducts.filter(p => {
                const ws = p.specs.wheelSize;
                if (!ws) return false;
                const match = ws.match(/([\d.]+)/);
                return match && match[1] === wheelSizeParam;
            });
        }

        // Fetch model priority from settings/catalog + color mappings
        let ebikeModelOrder: string[] = [];
        let regularModelOrder: string[] = [];
        let colorMappings: Record<string, string> = {};
        try {
            const [settingsSnap, colorSnap] = await Promise.all([
                getDoc(doc(db, 'settings', 'catalog')),
                getDoc(doc(db, 'settings', 'color_mappings')),
            ]);
            if (settingsSnap.exists()) {
                const settingsData = settingsSnap.data();
                ebikeModelOrder = (settingsData.ebikeModelOrder as string[]) || [];
                regularModelOrder = (settingsData.regularModelOrder as string[]) || [];
            }
            if (colorSnap.exists()) {
                colorMappings = (colorSnap.data().mappings as Record<string, string>) || {};
            }
        } catch (e) {
            console.error('Failed to load catalog settings:', e);
        }

        const toTitleCase = (s: string) => s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase());

        const getMoseIndex = (mose: string, isE: boolean): number => {
            const order = isE ? ebikeModelOrder : regularModelOrder;
            let idx = order.indexOf(mose);
            if (idx === -1 && mose) {
                const normalized = toTitleCase(mose.trim());
                idx = order.indexOf(normalized);
            }
            return idx === -1 ? 9999 : idx;
        };

        // Sort: MOSE priority → Year desc → Brand → Model
        filteredProducts.sort((a, b) => {
            const idxA = getMoseIndex(a.mose || '', a.isEbike);
            const idxB = getMoseIndex(b.mose || '', b.isEbike);
            if (idxA !== idxB) return idxA - idxB;
            if (b.year !== a.year) return b.year - a.year;
            if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
            return a.model.localeCompare(b.model);
        });

        // Pagination
        const total = filteredProducts.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const paginatedProducts = filteredProducts.slice(start, start + pageSize);

        return NextResponse.json({
            products: paginatedProducts,
            pagination: { total, page, pageSize, totalPages },
            filters: {
                categories,
                years,
                brands,
                moseOptions,
                moheOptions,
                sizeOptions,
                wheelSizeOptions,
            },
            colorMappings,
        });
    } catch (error) {
        console.error('Katalog2 API Error:', error);
        return NextResponse.json({ error: 'Failed to load katalog2' }, { status: 500 });
    }
}
