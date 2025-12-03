import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

// Types (copied from page.tsx for now, ideally should be in a types file)
export interface Bike {
    id: string;
    nrLf?: string;
    marke?: string;
    modell?: string;
    bild1?: string;
    motor?: string;
    akku?: string;
    ['Categorie (PRGR)']?: string;
    categoryPrgr?: string;
    sizes?: string[];
    capacitiesWh?: number[];
    b2bStockQuantity?: number;
    stockSizes?: string[];
    onTheWaySizes?: string[];
    mocCzk?: number;
    priceLevelsCzk?: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', number>>;
    mose?: string;
    variants?: { id: string; color: string; image: string; nrLf: string }[];
    frameType?: string;
}

const sanitize = (v?: string) => {
    const s = (v ?? '').toString().trim();
    const lower = s.toLowerCase();
    if (lower === 'unknown manual entry required') return '';
    if (lower === 'unknown') return '';
    if (lower === 'manual entry required') return '';
    return s;
};

// Helper to map color names to hex codes (approximate)
function getColorHex(colorName: string): string {
    const c = colorName.toLowerCase();
    if (c.includes('black') || c.includes('schwarz') || c.includes('černá')) return '#000000';
    if (c.includes('white') || c.includes('weiss') || c.includes('bílá')) return '#ffffff';
    if (c.includes('red') || c.includes('rot') || c.includes('červená')) return '#ef4444';
    if (c.includes('blue') || c.includes('blau') || c.includes('modrá') || c.includes('petrol')) return '#3b82f6';
    if (c.includes('green') || c.includes('grün') || c.includes('zelená') || c.includes('emerald')) return '#10b981';
    if (c.includes('yellow') || c.includes('gelb') || c.includes('žlutá')) return '#eab308';
    if (c.includes('orange') || c.includes('oranžová') || c.includes('peach')) return '#f97316';
    if (c.includes('grey') || c.includes('grau') || c.includes('šedá') || c.includes('silver')) return '#9ca3af';
    if (c.includes('purple') || c.includes('lila') || c.includes('fialová')) return '#a855f7';
    if (c.includes('pink') || c.includes('rosa') || c.includes('růžová')) return '#ec4899';
    if (c.includes('brown') || c.includes('braun') || c.includes('hnědá')) return '#78350f';
    if (c.includes('beige') || c.includes('sand')) return '#d6d3d1';
    return '#e5e7eb'; // default gray
}

export function BikeCard({ bike, viewMode }: { bike: Bike; viewMode: 'grid' | 'list' }) {
    const [activeVariantId, setActiveVariantId] = useState(bike.id);

    // Find the active variant object
    const activeVariant = bike.variants?.find(v => v.id === activeVariantId) || {
        id: bike.id,
        color: '', // fallback
        image: bike.bild1,
        nrLf: bike.nrLf
    };

    // Determine display image: variant image > bike image
    const displayImage = activeVariant.image || bike.bild1;

    // Get optimized image URL (use 'small' size for cards - 460x307px)
    const optimizedImage = getOptimizedImageUrl(displayImage, 'small', bike.marke);

    // Determine display NRLF
    const displayNrLf = activeVariant.nrLf || bike.nrLf;

    return (
        <div className={`group block bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col h-full'}`}>
            <Link href={`/catalog/${activeVariantId}`} className="block w-full">
                {/* Image Area */}
                <div className={`relative bg-zinc-50 group-hover:bg-zinc-100 transition-colors ${viewMode === 'grid' ? 'aspect-[4/3] p-6' : 'w-48 h-32 shrink-0 rounded-lg'}`}>
                    {displayImage ? (
                        <Image
                            src={optimizedImage}
                            alt={`${sanitize(bike.marke)} ${sanitize(bike.modell)}`.trim()}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-2"
                            unoptimized
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">Foto není k dispozici</div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {(() => {
                            const repSize = ((displayNrLf ?? '') as string).toString().match(/(\d{2})$/)?.[1];
                            const inStock = repSize ? (bike.stockSizes ?? []).includes(repSize) : (bike.stockSizes ?? []).length > 0;
                            const onWay = repSize ? (bike.onTheWaySizes ?? []).includes(repSize) : (bike.onTheWaySizes ?? []).length > 0;

                            if (inStock) return <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">SKLADEM</span>;
                            if (onWay) return <span className="text-[10px] font-bold px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">NA CESTĚ</span>;
                            return null;
                        })()}
                    </div>
                </div>
            </Link>

            {/* Content Area */}
            <div className={`flex flex-col ${viewMode === 'grid' ? 'p-5 flex-1' : 'flex-1 py-2'}`}>
                <div className="text-xs font-light text-zinc-500 uppercase tracking-wider mb-1">
                    {((displayNrLf ?? '').toString().replace(/\d{2}$/, ''))}
                </div>
                <Link href={`/catalog/${activeVariantId}`} className="block">
                    <h3 className={`font-bold text-zinc-900 group-hover:text-primary transition-colors mb-2 ${viewMode === 'grid' ? 'text-lg leading-tight' : 'text-xl'}`}>
                        {sanitize(bike.modell)}
                        {bike.frameType && bike.frameType !== 'Diamond' && <span className="text-zinc-500 font-normal ml-2 text-sm">({bike.frameType})</span>}
                    </h3>
                </Link>

                {/* Specs */}
                {(bike.motor || bike.akku) && (
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-zinc-500">
                        {bike.motor && <span className="bg-zinc-100 px-2 py-1 rounded">{bike.motor}</span>}
                        {bike.akku && <span className="bg-zinc-100 px-2 py-1 rounded">{bike.akku}</span>}
                    </div>
                )}

                {/* Color Variants */}
                {bike.variants && bike.variants.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {bike.variants.map(v => (
                            <button
                                key={v.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveVariantId(v.id);
                                }}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${activeVariantId === v.id ? 'border-primary scale-110' : 'border-zinc-200 hover:border-zinc-400'}`}
                                title={v.color}
                                style={{ backgroundColor: getColorHex(v.color) }}
                            />
                        ))}
                    </div>
                )}

                {/* Sizes */}
                {!!bike.sizes?.length && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {bike.sizes.map((s) => {
                            const inStock = (bike.stockSizes ?? []).includes(s);
                            const onWay = !inStock && (bike.onTheWaySizes ?? []).includes(s);
                            return (
                                <span
                                    key={s}
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${inStock ? 'bg-green-50 text-green-700 border-green-200' :
                                        onWay ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            'bg-zinc-50 text-zinc-400 border-zinc-100'
                                        }`}
                                >
                                    {s}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className={`mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between ${viewMode === 'list' ? 'w-full' : ''}`}>
                    <div className="text-lg font-bold text-zinc-900">
                        {typeof bike.mocCzk === 'number' && bike.mocCzk > 0 ? (
                            new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(bike.mocCzk)
                        ) : (
                            <span className="text-zinc-400 text-sm font-normal">Cena na vyžádání</span>
                        )}
                    </div>
                    {viewMode === 'list' && (
                        <Link href={`/catalog/${activeVariantId}`} className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full group-hover:bg-primary transition-colors">
                            Detail
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
