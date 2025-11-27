'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Variant {
    id: string;
    ean: string;
    size: string;
    color: string;
    frameShape: string;
    price: number;
    images: string[];
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
}

export default function DetailPageV2() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedFrameShape, setSelectedFrameShape] = useState<string>('');
    const [selectedBattery, setSelectedBattery] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/catalog-v2/${id}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setProduct(data);

                // Default Selections
                if (data.variants && data.variants.length > 0) {
                    const firstVariant = data.variants[0];
                    setSelectedColor(firstVariant.color);
                    setSelectedFrameShape(firstVariant.frameShape);
                    // Try to find battery capacity from specs or variant if available
                    // Note: The current import script doesn't put battery in variant explicitly,
                    // but we might need to infer it or if it's not there, we can't filter by it yet.
                    // Wait, the duplicate sizes suggest battery IS a factor, but is it in the variant data?
                    // The import script puts `price` and `images` in variant.
                    // It does NOT put battery capacity in variant.
                    // This is a problem. If battery capacity distinguishes variants, it MUST be in the variant object.
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
                <Link href="/catalog-new" className="text-primary hover:underline">Zpět do katalogu</Link>
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

    // Let's deduplicate sizes for display
    const availableSizes = Array.from(new Set(variantsInFrame.map(v => v.size))).sort((a, b) => {
        // Try numeric sort
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });

    // Get unique colors
    const colors = Array.from(new Set(product.variants.map(v => v.color)));

    // Get main image for selected color and frame shape (or first available)
    const mainImage = variantsInFrame[0]?.images[0] || product.images[0];

    // Get price range for this color and frame shape
    const prices = variantsInFrame.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceDisplay = minPrice === maxPrice
        ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(minPrice)
        : `${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(minPrice)} – ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(maxPrice)}`;

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            {/* Breadcrumbs */}
            <div className="bg-white border-b border-zinc-200">
                <div className="container-custom py-3">
                    <nav className="flex text-sm text-zinc-500">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Domů</Link>
                        <span className="mx-2">/</span>
                        <Link href="/catalog-new" className="hover:text-zinc-900 transition-colors">Katalog</Link>
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
                                        src={mainImage}
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
                                                    // Actually, useEffect or logic above handles it, but explicit is better
                                                    const vars = product.variants.filter(v => v.color === color);
                                                    if (vars.length > 0) setSelectedFrameShape(vars[0].frameShape);
                                                }}
                                                className={`group relative w-20 h-20 rounded-lg border overflow-hidden transition-all ${isActive
                                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                    : 'border-zinc-200 hover:border-zinc-300'
                                                    }`}
                                                title={color}
                                            >
                                                {image ? (
                                                    <Image
                                                        src={image}
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
                        </div>

                        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm mb-8">

                            {/* Frame Shape Selector */}
                            {frameShapes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-3">Typ rámu</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {frameShapes.map(shape => (
                                            <button
                                                key={shape}
                                                onClick={() => setSelectedFrameShape(shape)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeFrameShape === shape
                                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                                                    }`}
                                            >
                                                {shape}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                {availableSizes.map((size) => (
                                    <div key={size} className="relative group">
                                        <button
                                            className="h-12 px-4 rounded-lg border border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:shadow-sm text-sm font-medium transition-all flex items-center gap-2"
                                        >
                                            <span>{size}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="text-xs text-zinc-400 mt-2 space-y-1">
                                <div>Vybraná barva: <span className="font-medium text-zinc-700">{selectedColor}</span></div>
                                {activeFrameShape && <div>Vybraný rám: <span className="font-medium text-zinc-700">{activeFrameShape}</span></div>}
                            </div>
                        </div>

                        <div className="prose prose-zinc max-w-none">
                            <h3 className="text-lg font-bold text-zinc-900 mb-4">Specifikace</h3>

                            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                <div className="divide-y divide-zinc-50">
                                    {Object.entries(product.specs).map(([key, value]) => {
                                        if (!value) return null;
                                        // Map keys to readable labels if possible
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
                                                <div className="col-span-1 text-zinc-500 capitalize">{label}</div>
                                                <div className="col-span-2 text-zinc-900 font-medium">{String(value)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                            src={mainImage}
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
