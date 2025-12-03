/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { standardizeSize, detectCategory, sortSizes } from '@/lib/size-mapping';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

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
    sizes?: string[];
    stockSizes?: string[];
    onTheWaySizes?: string[];
    farf?: string;
}

export default function ProductCardV2({ product }: { product: ProductV2 }) {

    // Determine category for size mapping
    const category = detectCategory({ categoryPrgr: product.category, modell: product.model });

    // Standardize and deduplicate sizes
    const displaySizes = (product.sizes || []).reduce((acc, size) => {
        const std = standardizeSize(size, category);
        const inStock = (product.stockSizes || []).includes(size);
        const onTheWay = (product.onTheWaySizes || []).includes(size);

        if (!acc[std]) {
            acc[std] = { label: std, inStock: false, onTheWay: false };
        }
        if (inStock) {
            acc[std].inStock = true;
        }
        if (onTheWay) {
            acc[std].onTheWay = true;
        }
        return acc;
    }, {} as Record<string, { label: string, inStock: boolean, onTheWay: boolean }>);

    const sortedSizes = Object.values(displaySizes).sort((a, b) => sortSizes(a.label, b.label));

    // Format price removed as it was unused and causing lint error

    const hasStock = product.hasStock || (product.stockSizes && product.stockSizes.length > 0);
    const hasOnTheWay = !hasStock && (product.onTheWaySizes && product.onTheWaySizes.length > 0);

    return (
        <Link href={`/catalog/${product.id}`} className="group block h-full">
            <div
                className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
            >
                {/* Image Area */}
                <div className="aspect-[4/3] relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors overflow-hidden">
                    {/* Main Image */}
                    {product.images[0] ? (
                        <Image
                            src={getOptimizedImageUrl(product.images[0], 'small', product.brand)}
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
                        ) : hasOnTheWay ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200 uppercase">
                                Na cestě
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

                    {/* Sizes */}
                    {sortedSizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {sortedSizes.map(({ label, inStock, onTheWay }) => (
                                <span
                                    key={label}
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${inStock
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : onTheWay
                                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                                            : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                        }`}
                                >
                                    {label}
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
                        <div className="text-xs text-zinc-400 font-medium">
                            {product.variants.length} variant
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
