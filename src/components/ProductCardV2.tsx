/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { standardizeSize, detectCategory, sortSizes } from '@/lib/size-mapping';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { guessHexFromName } from '@/lib/colorUtils';

import { useAuth } from './AuthProvider';

interface ProductV2 {
    id: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    minPrice: number;
    maxPrice: number;
    images: string[];
    variants: any[];
    specs: {
        motor?: string;
        battery?: string;
        capacity?: string;
        frameMaterial?: string;
        wheelSize?: string;
    };
    hasStock?: boolean;
    isOnOrder?: boolean;
    b2bOrderStatus?: string;
    sizes?: string[];
    stockSizes?: string[];
    onOrderSizes?: string[];
    farf?: string;
    priceLevelsCzk?: Partial<Record<'A' | 'B' | 'C' | 'D', number>>;
    // Expansion properties (when showing specific color variants)
    primaryImage?: string;
    primaryColor?: string;
    primaryVariantId?: string;
    _isExpanded?: boolean;
    _displayColor?: string;
    manualB2BPrice?: number;
    colors?: string[];
}

export default function ProductCardV2({ product, detailBasePath = '/catalog', colorMappings = {} }: { product: ProductV2; detailBasePath?: string; colorMappings?: Record<string, string> }) {
    const { shopUser, hideB2BPrices } = useAuth();

    // ... rest of component logic ...


    const category = detectCategory({ categoryPrgr: product.category, modell: product.model });

    // Standardize, deduplicate sizes, and count stock
    const sizeMap = new Map<string, { label: string, count: number, inStock: boolean, onOrder: boolean, inTransit: boolean }>();

    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
            if (!variant.size) return;
            const std = standardizeSize(variant.size, category);
            const stock = Number(variant.stock) || Number(variant.onHand) || Number(variant.qty) || Number(variant.b2bStockQuantity) || 0;

            if (!sizeMap.has(std)) {
                sizeMap.set(std, { label: std, count: 0, inStock: false, onOrder: false, inTransit: false });
            }

            const entry = sizeMap.get(std)!;
            entry.count += stock;
            if (stock > 0 || variant.b2bOrderStatus === 'skladem') entry.inStock = true;
            if (variant.b2bOrderStatus === 'na_ceste' && !entry.inStock) entry.inTransit = true;
            if (variant.b2bOrderStatus === 'na_objednavku' && !entry.inStock && !entry.inTransit) entry.onOrder = true;
        });
    } else if (product.sizes) {
        product.sizes.forEach(size => {
            const std = standardizeSize(size, category);
            if (!sizeMap.has(std)) {
                const inStock = (product.stockSizes || []).includes(size);
                const onOrder = (product.onOrderSizes || []).includes(size);
                const inTransit = ((product as any).transitSizes || []).includes(size);
                sizeMap.set(std, { label: std, count: 0, inStock, onOrder, inTransit });
            }
        });
    }

    const sortedSizes = Array.from(sizeMap.values()).sort((a, b) => sortSizes(a.label, b.label));

    // Format price removed as it was unused and causing lint error

    const hasStock = product.hasStock || (product.stockSizes && product.stockSizes.length > 0);
    const hasTransit = !hasStock && (product.b2bOrderStatus === 'na_ceste');
    const isOnOrder = !hasStock && !hasTransit && (product.isOnOrder || product.b2bOrderStatus === 'na_objednavku');

    // Use primaryImage if available (expanded variant), otherwise first image
    const displayImage = product.primaryImage || product.images?.[0];

    // Always link to product ID (not variant ID)
    // If we have a specific color variant, add it as a query parameter for pre-selection
    const baseLink = `${detailBasePath}/${product.id}`;
    const linkHref = product.primaryColor ? `${baseLink}?color=${encodeURIComponent(product.primaryColor)}` : baseLink;

    return (
        <Link href={linkHref} className="group block h-full">
            <div
                className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
            >
                {/* Image Area */}
                <div className="aspect-[4/3] relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors overflow-hidden">
                    {/* Main Image */}
                    {displayImage ? (
                        <Image
                            src={getOptimizedImageUrl(displayImage, 'small', product.brand)}
                            alt={`${product.brand} ${product.model}`}
                            fill
                            className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-95"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 text-sm">
                            Bez fotografie
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {hasStock ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200 uppercase">
                                Skladem
                            </span>
                        ) : hasTransit ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase">
                                Na cestě
                            </span>
                        ) : isOnOrder ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-100 text-zinc-500 border border-zinc-200 uppercase">
                                Na objednávku
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-primary tracking-wider uppercase">{product.brand}</span>
                            <span className="text-xs text-zinc-400 mx-2">•</span>
                            <span className="text-xs text-zinc-500">{product.category}</span>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.model}
                    </h3>

                    {/* Color Dots */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="flex gap-1.5 mb-2 items-center">
                            {product.colors.slice(0, 5).map(color => {
                                const hex = colorMappings[color] || guessHexFromName(color) || '#d1d5db';
                                const isLight = isLightColor(hex);
                                return (
                                    <span
                                        key={color}
                                        className="w-3.5 h-3.5 rounded-full border inline-block flex-shrink-0"
                                        style={{
                                            backgroundColor: hex,
                                            borderColor: isLight ? '#d4d4d8' : hex,
                                        }}
                                        title={color}
                                    />
                                );
                            })}
                            {product.colors.length > 5 && (
                                <span className="text-[10px] text-zinc-400">+{product.colors.length - 5}</span>
                            )}
                        </div>
                    )}

                    {/* Sizes */}
                    {sortedSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {sortedSizes.map(({ label, count, inStock, onOrder, inTransit }) => (
                                <span
                                    key={label}
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${inStock
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : inTransit
                                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                                            : onOrder
                                                ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                        }`}
                                >
                                    {label}{count > 0 ? ` (${count})` : ''}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-zinc-500 mb-4 mt-auto">
                        {product.specs.capacity && (
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{product.specs.capacity}</span>
                            </div>
                        )}
                        {product.specs.wheelSize && (
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>{product.specs.wheelSize}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                        <div>
                            <div className="text-xl font-bold text-zinc-900">
                                {product.minPrice === product.maxPrice ? (
                                    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(product.minPrice)
                                ) : (
                                    <>
                                        <span className="text-sm font-normal text-zinc-500 mr-1">od</span>
                                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(product.minPrice)}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {(() => {
                        // CRITICAL: Only show B2B prices to logged-in users
                        if (!shopUser) return null;

                        const priceLevel = shopUser?.priceLevel as 'A' | 'B' | 'C' | 'D' | undefined;
                        let b2bPrice = priceLevel && product.priceLevelsCzk ? product.priceLevelsCzk[priceLevel] : null;

                        // Check for manual B2B price on the product (root level)
                        // Support both 'manualB2BPrice' (new sync) and 'b2bPrice' (legacy/manual entry)
                        const rootManualPrice = Number(product.manualB2BPrice) || Number((product as any).b2bPrice) || 0;

                        if (rootManualPrice > 0) {
                            b2bPrice = rootManualPrice;
                        } else {
                            // Check stock variants for manual B2B price override
                            if (product.variants && Array.isArray(product.variants)) {
                                const stockVariant = product.variants.find((v: any) => {
                                    const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                                    return stock > 0 && (Number(v.b2bPrice) > 0);
                                });

                                if (stockVariant) {
                                    b2bPrice = Number(stockVariant.b2bPrice);
                                }
                            }
                        }

                        if (b2bPrice && !hideB2BPrices) {
                            return (
                                <div className="mt-1">
                                    <div className="text-sm font-bold text-primary">
                                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(b2bPrice)}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-wide leading-none">Bez DPH</div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    <div className="text-xs text-zinc-400 font-medium">
                        {product.variants.length} variant
                    </div>
                </div>
            </div>
        </Link>
    );
}

/** Zjistí zda je barva světlá (pro volbu borderu) */
function isLightColor(hex: string): boolean {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}
