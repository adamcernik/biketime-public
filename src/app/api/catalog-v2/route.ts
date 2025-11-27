/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

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
        const ebikeParam = searchParams.get('ebike'); // 'true' | 'false' | null
        const inStockParam = searchParams.get('inStock'); // 'true' | null

        // Fetch priority settings
        const settingsRef = doc(db, 'settings', 'catalog');
        const settingsSnap = await getDoc(settingsRef);
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const ebikeOrder = (settingsData.ebikeModelOrder as string[]) || [];
        const regularOrder = (settingsData.regularModelOrder as string[]) || [];

        const getMoseIndex = (mose: string, isE: boolean) => {
            const order = isE ? ebikeOrder : regularOrder;
            // Use fuzzy match or exact match? Old catalog uses indexOf which is exact.
            // But mose names in settings might be normalized.
            // Let's assume exact match as per old catalog.
            const idx = order.indexOf(mose);
            return idx === -1 ? 9999 : idx;
        };

        const q = collection(db, 'products_v2');
        
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map(d => {
            const data = d.data();
            const product = { id: d.id, ...data } as any;
            
            // Enhance product with helpers
            const isE = isEbike(product);
            const rawCategory = product.category || '';
            const mappedCategory = mapRawToTag(rawCategory, isE);

            // Try to find mose (Model Series)
            const mose = product.mose || product.specs?.['Model series (MOSE)'] || '';
            
            // Stock and Size calculation
            const variants = (product.variants && Array.isArray(product.variants)) ? product.variants : [];
            const sizesSet = new Set<string>();
            const stockSizesSet = new Set<string>();
            const onTheWaySizesSet = new Set<string>();
            let hasStock = false;

            variants.forEach((v: any) => {
                const size = v.size || v.velikost || '';
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

            const sizes = Array.from(sizesSet).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
            const stockSizes = Array.from(stockSizesSet);
            const onTheWaySizes = Array.from(onTheWaySizesSet);

            return {
                ...product,
                isEbike: isE,
                originalCategory: rawCategory,
                category: mappedCategory || rawCategory, // Use mapped category for display and filtering
                mose,
                hasStock,
                sizes,
                stockSizes,
                onTheWaySizes
            };
        });

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

        // 2. Extract Options from Base Set
        const categories = Array.from(new Set(baseProducts.map(p => p.category).filter(Boolean))).sort();
        // brands removed
        const years = Array.from(new Set(baseProducts.map(p => p.year).filter(Boolean))).sort((a: any, b: any) => b - a);
        const moseOptions = Array.from(new Set(baseProducts.map(p => p.mose).filter(Boolean))).sort();

        // 3. Apply Selection Filters (Category, Year, Mose, Search)
        let filteredProducts = baseProducts;

        if (searchParam) {
            const s = searchParam.toLowerCase();
            filteredProducts = filteredProducts.filter(p => {
                const brand = (p.brand || '').toLowerCase();
                const model = (p.model || '').toLowerCase();
                const nrLf = (p.nrLf || '').toLowerCase(); // assuming nrLf exists
                const category = (p.category || '').toLowerCase();
                
                // Check if any variant matches the search code
                const hasMatchingVariant = p.variants && Array.isArray(p.variants) 
                    ? p.variants.some((v: any) => (v.nrLf || '').toLowerCase().includes(s))
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
                moseOptions
            }
        });

    } catch (error) {
        console.error('Catalog V2 Error:', error);
        return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 });
    }
}
