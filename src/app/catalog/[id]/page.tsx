/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sortSizes, standardizeSize, detectCategory } from '@/lib/size-mapping';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { useAuth } from '../../../components/AuthProvider';

interface Variant {
    id: string;
    ean: string;
    nrLf?: string;
    size: string;
    color: string;
    frameShape: string;
    price: number;
    images: string[];
    capacity?: string;
    stock?: number;
    onHand?: number;
    qty?: number;
    b2bStockQuantity?: number;
    inTransit?: number;
    onTheWay?: number;
    b2bPrice?: number;
}

interface Product {
    id: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    specs: any;
    variants: Variant[];
    images: string[];
    minPrice: number;
    maxPrice: number;
    priceLevelsCzk?: Partial<Record<'A' | 'B' | 'C' | 'D', number>>;
}

export default function DetailPageV2() {
    const { id } = useParams<{ id: string }>();
    const { shopUser, hideB2BPrices } = useAuth();
    // const router = useRouter(); // Unused variable removed

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedFrameShape, setSelectedFrameShape] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedCapacity, setSelectedCapacity] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/catalog/${id}`, { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setProduct(data);

                // Check if color is specified in URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const urlColor = urlParams.get('color');

                // Default Selections
                if (data.variants && data.variants.length > 0) {
                    // Try to find variant matching URL color parameter
                    let initialVariant = data.variants[0];

                    if (urlColor) {
                        const matchingVariant = data.variants.find((v: any) =>
                            v.color && v.color.toLowerCase() === urlColor.toLowerCase()
                        );
                        if (matchingVariant) {
                            initialVariant = matchingVariant;
                        }
                    }

                    setSelectedColor(initialVariant.color);
                    setSelectedFrameShape(initialVariant.frameShape);

                    // Pre-select capacity
                    const relevantVariants = data.variants.filter((v: any) =>
                        v.color === initialVariant.color &&
                        v.frameShape === initialVariant.frameShape
                    );
                    const capacities = Array.from(new Set(relevantVariants.map((v: any) => v.capacity)))
                        .filter(Boolean)
                        .sort((a: any, b: any) => parseInt(a || '0') - parseInt(b || '0'));

                    if (capacities.length > 0) {
                        setSelectedCapacity(capacities[0] as string);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    // Handle Modal
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        if (isModalOpen) {
            window.addEventListener('keydown', onKey);
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
        }
        return () => {
            window.removeEventListener('keydown', onKey);
            document.documentElement.style.overflow = '';
        };
    }, [isModalOpen]);

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Kolo nenalezeno</h1>
                <Link href="/catalog" className="text-primary hover:underline">Zpět do katalogu</Link>
            </div>
        </div>
    );

    // 1. Filter by Color
    const variantsInColor = product.variants.filter(v => v.color === selectedColor);

    // 2. Get Available Frame Shapes for this Color
    const frameShapes = Array.from(new Set(variantsInColor.map(v => v.frameShape))).filter(Boolean).sort();

    // Auto-select frame shape if only one exists or current selection is invalid
    // We can't update state during render. This logic should be in useEffect or handler.
    // For now, let's just use the first one if selected is invalid.
    const activeFrameShape = frameShapes.includes(selectedFrameShape) ? selectedFrameShape : frameShapes[0];

    // 3. Filter by Frame Shape
    const variantsInFrame = variantsInColor.filter(v => v.frameShape === activeFrameShape);

    // 4. Handle Battery/Price Differences?
    // Since we don't have battery in variant data, we might still have duplicates if price differs?
    // Let's check if we have duplicates by size in `variantsInFrame`.
    // If we do, we simply group them or show the one with the lowest price?
    // Or maybe we just show unique sizes and if the user clicks, we pick one?

    // Determine category for size mapping
    const category = detectCategory({ categoryPrgr: product.category, modell: product.model });

    // Let's deduplicate sizes for display
    const availableSizes = Array.from(new Set(variantsInFrame.map(v => standardizeSize(v.size, category)))).sort(sortSizes);

    // Get unique colors
    const colors = Array.from(new Set(product.variants.map(v => v.color)));

    // Get main image for selected color and frame shape (or first available)
    const mainImage = variantsInFrame[0]?.images[0] || product.images[0];

    // Get price range for this color and frame shape
    // Get price range for this color and frame shape
    // Filter by Capacity for price calculation
    const variantsForPrice = selectedCapacity
        ? variantsInFrame.filter(v => v.capacity === selectedCapacity)
        : variantsInFrame;

    const prices = variantsForPrice.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    let priceDisplay;

    if (selectedSize) {
        const selectedVariant = variantsInFrame.find(v =>
            standardizeSize(v.size, category) === selectedSize &&
            (!selectedCapacity || v.capacity === selectedCapacity)
        );
        if (selectedVariant) {
            priceDisplay = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(selectedVariant.price);
        }
    }

    if (!priceDisplay) {
        priceDisplay = minPrice === maxPrice
            ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(minPrice)
            : (
                <>
                    <span className="text-lg font-normal text-zinc-500 mr-2">od</span>
                    {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(minPrice)}
                </>
            );
    }

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            {/* Breadcrumbs */}
            <div className="bg-white border-b border-zinc-200">
                <div className="container-custom py-3">
                    <nav className="flex text-sm text-zinc-500">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Domů</Link>
                        <span className="mx-2">/</span>
                        <Link href="/catalog" className="hover:text-zinc-900 transition-colors">Katalog</Link>
                        <span className="mx-2">/</span>
                        <span className="text-zinc-900 font-medium truncate">{product.brand} {product.model}</span>
                    </nav>
                </div>
            </div>

            <section className="container-custom py-8 lg:py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <div
                            className={`relative aspect-[4/3] bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm ${mainImage ? 'cursor-zoom-in group' : ''}`}
                            onClick={() => {
                                if (mainImage) setIsModalOpen(true);
                            }}
                        >
                            {mainImage ? (
                                <>
                                    <Image
                                        src={getOptimizedImageUrl(mainImage, 'large', product.brand)}
                                        alt={`${product.brand} ${product.model}`}
                                        fill
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        className="object-contain p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                                        priority
                                        unoptimized
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-2 shadow-sm text-zinc-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                                    Foto není k dispozici
                                </div>
                            )}
                        </div>

                        {/* Color Variants */}
                        {colors.length > 1 && (
                            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">Barevné varianty</h3>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((color) => {
                                        const isActive = color === selectedColor;
                                        // Find first variant with this color to get image
                                        const variant = product.variants.find(v => v.color === color);
                                        const image = variant?.images[0];

                                        return (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    // Reset frame shape when color changes to avoid invalid state
                                                    const vars = product.variants.filter(v => v.color === color);
                                                    let newFrame = '';
                                                    if (vars.length > 0) {
                                                        newFrame = vars[0].frameShape;
                                                        setSelectedFrameShape(newFrame);
                                                    }
                                                    setSelectedSize(''); // Reset size

                                                    // Auto-select capacity
                                                    if (newFrame) {
                                                        const varsInFrame = vars.filter(v => v.frameShape === newFrame);
                                                        const caps = Array.from(new Set(varsInFrame.map(v => v.capacity))).filter(Boolean).sort((a, b) => parseInt(a || '0') - parseInt(b || '0'));
                                                        if (caps.length > 0) setSelectedCapacity(caps[0] || '');
                                                        else setSelectedCapacity('');
                                                    } else {
                                                        setSelectedCapacity('');
                                                    }
                                                }}
                                                className={`group relative w-20 h-20 rounded-lg border overflow-hidden transition-all ${isActive
                                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                    : 'border-zinc-200 hover:border-zinc-300'
                                                    }`}
                                                title={color}
                                            >
                                                {image ? (
                                                    <Image
                                                        src={getOptimizedImageUrl(image, 'thumbnail', product.brand)}
                                                        alt={color}
                                                        fill
                                                        className="object-contain p-1 mix-blend-multiply"
                                                        sizes="80px"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-xs text-zinc-400 p-1 text-center">
                                                        {color}
                                                    </div>
                                                )}
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">{product.brand}</div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 mb-4 leading-tight">{product.model}</h1>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {product.specs.motor && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
                                        <svg className="w-4 h-4 mr-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {product.specs.motor}
                                    </span>
                                )}
                                {product.specs.battery && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
                                        <svg className="w-4 h-4 mr-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        {product.specs.battery}
                                    </span>
                                )}
                                {product.year && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
                                        {product.year}
                                    </span>
                                )}
                            </div>

                            <div className="text-4xl font-bold text-zinc-900 mb-2">
                                {priceDisplay}
                            </div>
                            <div className="text-sm text-zinc-500">Včetně DPH</div>

                            {/* B2B Price */}
                            {(() => {
                                const priceLevel = shopUser?.priceLevel as 'A' | 'B' | 'C' | 'D' | undefined;
                                let b2bPrice = priceLevel && product.priceLevelsCzk ? product.priceLevelsCzk[priceLevel] : null;

                                // Check for manual B2B price
                                if (selectedSize) {
                                    // If size is selected, look at the specific variant
                                    const selectedVariant = variantsInFrame.find(v =>
                                        standardizeSize(v.size, category) === selectedSize &&
                                        (!selectedCapacity || v.capacity === selectedCapacity)
                                    );

                                    if (selectedVariant && (selectedVariant as any).b2bPrice > 0) {
                                        b2bPrice = Number((selectedVariant as any).b2bPrice);
                                    }
                                } else {
                                    // Fallback to finding ANY stock variant with B2B price (like on card)
                                    const stockVariant = product.variants.find((v: any) => {
                                        const stock = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                                        return stock > 0 && (Number(v.b2bPrice) > 0);
                                    });

                                    if (stockVariant) {
                                        b2bPrice = Number(stockVariant.b2bPrice);
                                    }
                                }

                                if (b2bPrice && !hideB2BPrices) {
                                    return (
                                        <div className="mt-4 mb-2 bg-zinc-50 p-4 rounded-xl border border-zinc-100 inline-block">
                                            <div className="text-2xl font-bold text-primary">
                                                {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(b2bPrice)}
                                            </div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wide">Nákupní cena bez DPH</div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm mb-8">

                            {/* Frame Shape Selector */}
                            {frameShapes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-3">Typ rámu</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {frameShapes.length === 1 ? (
                                            <div className="px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 text-sm font-medium cursor-default">
                                                {frameShapes[0]}
                                            </div>
                                        ) : (
                                            frameShapes.map(shape => (
                                                <button
                                                    key={shape}
                                                    onClick={() => {
                                                        setSelectedFrameShape(shape);
                                                        setSelectedSize(''); // Reset size

                                                        // Auto-select capacity
                                                        const varsInColor = product.variants.filter(v => v.color === selectedColor);
                                                        const varsInFrame = varsInColor.filter(v => v.frameShape === shape);
                                                        const caps = Array.from(new Set(varsInFrame.map(v => v.capacity))).filter(Boolean).sort((a, b) => parseInt(a || '0') - parseInt(b || '0'));
                                                        if (caps.length > 0) setSelectedCapacity(caps[0] || '');
                                                        else setSelectedCapacity('');
                                                    }}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeFrameShape === shape
                                                        ? 'border-zinc-900 bg-zinc-900 text-white'
                                                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                                                        }`}
                                                >
                                                    {shape}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Battery Capacity Selector */}
                            {(() => {
                                // Find all capacities available for the selected color and frame shape
                                const capacities = Array.from(new Set(variantsInFrame.map(v => v.capacity))).filter(Boolean).sort((a, b) => parseInt(a || '0') - parseInt(b || '0'));

                                if (capacities.length > 0) {
                                    return (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-3">Kapacita baterie</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {capacities.length === 1 ? (
                                                    <div className="px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 text-sm font-medium cursor-default">
                                                        {(() => {
                                                            const cap = capacities[0];
                                                            return cap?.toLowerCase().includes('wh') ? cap : `${cap} Wh`;
                                                        })()}
                                                    </div>
                                                ) : (
                                                    capacities.map(cap => (
                                                        <button
                                                            key={cap}
                                                            onClick={() => {
                                                                setSelectedCapacity(cap || '');
                                                                // Keep size selected when changing battery
                                                            }}
                                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedCapacity === cap
                                                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                                                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                                                                }`}
                                                        >
                                                            {cap?.toLowerCase().includes('wh') ? cap : `${cap} Wh`}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Velikost rámu</h3>
                                <Link href="/size-guide" target="_blank" className="text-sm text-primary hover:underline flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Tabulka velikostí
                                </Link>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {availableSizes.map((size) => {
                                    // Find variants with this standardized size AND selected capacity
                                    const variants = variantsInFrame.filter(v =>
                                        standardizeSize(v.size, category) === size &&
                                        (!selectedCapacity || v.capacity === selectedCapacity)
                                    );

                                    // Check if any of these variants are in stock or on the way
                                    const inStockVariant = variants.find(v => {
                                        const s = Number(v.stock) || Number(v.onHand) || Number(v.qty) || Number(v.b2bStockQuantity) || 0;
                                        return s > 0;
                                    });

                                    const onTheWayVariant = variants.find(v => {
                                        const s = Number(v.inTransit) || Number(v.onTheWay) || 0;
                                        return s > 0;
                                    });

                                    const variant = inStockVariant || onTheWayVariant || variants[0];
                                    const stock = variant ? (Number(variant.stock) || Number(variant.onHand) || Number(variant.qty) || Number(variant.b2bStockQuantity) || 0) : 0;
                                    const transit = variant ? (Number(variant.inTransit) || Number(variant.onTheWay) || 0) : 0;

                                    const inStock = stock > 0;
                                    const onTheWay = !inStock && transit > 0;
                                    const isSelected = selectedSize === size;

                                    if (!variant && selectedCapacity) return null; // Don't show size if not available in this capacity

                                    return (
                                        <div key={size} className="relative group">
                                            <button
                                                onClick={() => setSelectedSize(size)}
                                                className={`h-12 px-4 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                                                    ${isSelected
                                                        ? 'border-zinc-900 bg-zinc-900 text-white'
                                                        : inStock
                                                            ? 'border-green-200 bg-green-50 text-green-800 hover:border-green-300'
                                                            : onTheWay
                                                                ? 'border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-300'
                                                                : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:shadow-sm'
                                                    }
                                                `}
                                            >
                                                <span>{size}</span>
                                                {inStock && !isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                )}
                                                {onTheWay && !isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-xs text-zinc-400 mt-2 space-y-1">
                                <div>Vybraná barva: <span className="font-medium text-zinc-700">{selectedColor}</span></div>
                                {activeFrameShape && <div>Vybraný rám: <span className="font-medium text-zinc-700">{activeFrameShape}</span></div>}
                                {selectedCapacity && <div>Vybraná baterie: <span className="font-medium text-zinc-700">{selectedCapacity?.toLowerCase().includes('wh') ? selectedCapacity : `${selectedCapacity} Wh`}</span></div>}
                                {selectedSize && <div>Vybraná velikost: <span className="font-medium text-zinc-700">{selectedSize}</span></div>}

                                {(() => {
                                    if (!selectedSize) return null;
                                    const selectedVariant = variantsInFrame.find(v =>
                                        standardizeSize(v.size, category) === selectedSize &&
                                        (!selectedCapacity || v.capacity === selectedCapacity)
                                    );

                                    const nrLfToShow = selectedVariant?.nrLf || selectedVariant?.id;

                                    if (nrLfToShow) {
                                        return (
                                            <div className="pt-2 mt-2 border-t border-zinc-100">
                                                ID produktu (NRLF): <span className="font-mono font-medium text-zinc-700">{nrLfToShow}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        <div className="prose prose-zinc max-w-none">
                            <h3 className="text-lg font-bold text-zinc-900 mb-4">Specifikace</h3>

                            <div className="space-y-8">
                                {[
                                    {
                                        title: 'E-bike systém',
                                        keys: [
                                            'motor', 'motorManufacturer', 'motorType', 'motorPower', 'motorTorque', 'motorSupport',
                                            'battery', 'batteryManufacturer', 'capacity', 'batteryType', 'charger',
                                            'display', 'remote'
                                        ]
                                    },
                                    {
                                        title: 'Rám a odpružení',
                                        keys: [
                                            'frame', 'frameMaterial', 'fork', 'travelFork', 'rearSuspension', 'travelRear', 'headset'
                                        ]
                                    },
                                    {
                                        title: 'Pohon',
                                        keys: [
                                            'gears', 'derailleurType', 'rearDerailleur', 'frontDerailleur', 'shifter',
                                            'crankset', 'cassette', 'chain', 'pedals'
                                        ]
                                    },
                                    {
                                        title: 'Brzdy',
                                        keys: [
                                            'brakes', 'brakeLever', 'brakeFront', 'brakeRear',
                                            'brakeDiscFront', 'brakeDiscRear', 'coasterBrake'
                                        ]
                                    },
                                    {
                                        title: 'Kola',
                                        keys: [
                                            'wheelSize', 'tireSize', 'tireSizeInch', 'tires',
                                            'rims', 'wheelset', 'hubFront', 'hubRear'
                                        ]
                                    },
                                    {
                                        title: 'Komponenty',
                                        keys: [
                                            'handlebar', 'stem', 'grips', 'saddle', 'seatpost',
                                            'frontLight', 'rearLight', 'carrier', 'mudguards',
                                            'stand', 'lock', 'gps', 'monkeyLink', 'monkeyLoad'
                                        ]
                                    },
                                    {
                                        title: 'Ostatní',
                                        keys: [
                                            'weight', 'weightNoBattery', 'maxWeight', 'intendedUse', 'fieldOfApplication'
                                        ]
                                    }
                                ].map((section) => {
                                    // Filter keys that have values
                                    const sectionSpecs = section.keys.filter(key => product.specs[key]);

                                    if (sectionSpecs.length === 0) return null;

                                    return (
                                        <div key={section.title} className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-100 font-semibold text-zinc-900">
                                                {section.title}
                                            </div>
                                            <div className="divide-y divide-zinc-50">
                                                {sectionSpecs.map(key => {
                                                    const value = product.specs[key];
                                                    const labels: Record<string, string> = {
                                                        // Motor & Battery
                                                        motorManufacturer: 'Výrobce motoru',
                                                        motor: 'Motor',
                                                        motorType: 'Typ motoru',
                                                        motorPower: 'Výkon motoru',
                                                        motorTorque: 'Točivý moment',
                                                        motorSupport: 'Podpora motoru',
                                                        batteryManufacturer: 'Výrobce baterie',
                                                        battery: 'Baterie',
                                                        capacity: 'Kapacita baterie',
                                                        batteryType: 'Typ baterie',
                                                        charger: 'Nabíječka',
                                                        display: 'Displej',
                                                        remote: 'Ovládání',

                                                        // Frame & Fork
                                                        frame: 'Rám',
                                                        frameMaterial: 'Materiál rámu',
                                                        fork: 'Vidlice',
                                                        travelFork: 'Zdvih vidlice',
                                                        rearSuspension: 'Tlumič',
                                                        travelRear: 'Zdvih tlumiče',
                                                        headset: 'Hlavové složení',

                                                        // Wheels
                                                        wheelSize: 'Velikost kol',
                                                        tireSize: 'Pláště (ETRTO)',
                                                        tireSizeInch: 'Pláště (palce)',
                                                        tires: 'Pláště',
                                                        rims: 'Ráfky',
                                                        wheelset: 'Zapletená kola',
                                                        hubFront: 'Přední náboj',
                                                        hubRear: 'Zadní náboj',

                                                        // Drivetrain
                                                        gears: 'Počet převodů',
                                                        derailleurType: 'Typ řazení',
                                                        rearDerailleur: 'Přehazovačka',
                                                        frontDerailleur: 'Přesmykač',
                                                        shifter: 'Řazení',
                                                        crankset: 'Kliky',
                                                        cassette: 'Kazeta',
                                                        chain: 'Řetěz',
                                                        pedals: 'Pedály',

                                                        // Brakes
                                                        brakes: 'Brzdy',
                                                        brakeLever: 'Brzdové páky',
                                                        brakeFront: 'Přední brzda',
                                                        brakeRear: 'Zadní brzda',
                                                        brakeDiscFront: 'Přední kotouč',
                                                        brakeDiscRear: 'Zadní kotouč',
                                                        coasterBrake: 'Protišlapná brzda',

                                                        // Cockpit
                                                        handlebar: 'Řidítka',
                                                        stem: 'Představec',
                                                        grips: 'Gripy',
                                                        saddle: 'Sedlo',
                                                        seatpost: 'Sedlovka',

                                                        // Accessories
                                                        frontLight: 'Přední světlo',
                                                        rearLight: 'Zadní světlo',
                                                        carrier: 'Nosič',
                                                        mudguards: 'Blatníky',
                                                        stand: 'Stojánek',
                                                        lock: 'Zámek',
                                                        gps: 'GPS',
                                                        monkeyLink: 'MonkeyLink',
                                                        monkeyLoad: 'MonkeyLoad',

                                                        // Other
                                                        weight: 'Hmotnost',
                                                        weightNoBattery: 'Hmotnost bez baterie',
                                                        maxWeight: 'Nosnost',
                                                        intendedUse: 'Určení',
                                                        fieldOfApplication: 'Oblast použití'
                                                    };
                                                    const label = labels[key] || key;

                                                    return (
                                                        <div key={key} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                                                            <div className="col-span-1 text-zinc-500">{label}</div>
                                                            <div className="col-span-2 text-zinc-900 font-medium">{String(value)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Image Lightbox */}
            {isModalOpen && mainImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            aria-label="Zavřít"
                            className="h-12 w-12 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 flex items-center justify-center transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsModalOpen(false);
                            }}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="relative w-[95vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={isMobile ? getOptimizedImageUrl(mainImage, 'large', product.brand) : mainImage}
                            alt={`${product.brand} ${product.model}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
