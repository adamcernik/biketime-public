'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

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
}

export default function ProductCardV2({ product }: { product: ProductV2 }) {
    const [isHovered, setIsHovered] = useState(false);

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const priceDisplay = product.minPrice === product.maxPrice
        ? formatPrice(product.minPrice)
        : `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`;

    const hasStock = product.hasStock || (product.stockSizes && product.stockSizes.length > 0);

    return (
        <Link href={`/catalog-new/${product.id}`} className="group block h-full">
            <div
                className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Area */}
                <div className="aspect-[4/3] relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors overflow-hidden">
                    {/* Main Image */}
                    {product.images[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={`${product.brand} ${product.model}`}
                            fill
                            className={`object-contain mix-blend-multiply transition-all duration-500 ${isHovered && product.images[1] ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 text-sm">
                            Bez fotografie
                        </div>
                    )}

                    {/* Secondary Image (on hover) */}
                    {product.images[1] && (
                        <Image
                            src={product.images[1]}
                            alt={`${product.brand} ${product.model} - view 2`}
                            fill
                            className={`object-contain mix-blend-multiply transition-all duration-500 absolute inset-0 p-6 ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-95'}`}
                            unoptimized
                        />
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {hasStock && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200 uppercase">
                                Skladem
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-2">
                        <span className="text-xs font-bold text-primary tracking-wider uppercase">{product.brand}</span>
                        <span className="text-xs text-zinc-400 mx-2">•</span>
                        <span className="text-xs text-zinc-500">{product.category}</span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.model}
                    </h3>

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {product.sizes.map(size => {
                                const inStock = (product.stockSizes || []).includes(size);
                                return (
                                    <span
                                        key={size}
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                            inStock
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                        }`}
                                    >
                                        {size}
                                    </span>
                                );
                            })}
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

                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                        <div className="text-lg font-bold text-zinc-900">
                            {priceDisplay}
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
