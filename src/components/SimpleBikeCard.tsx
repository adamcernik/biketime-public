'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export type SimpleBikeCardProps = {
    id: string;
    marke?: string;
    modell?: string;
    bild1?: string;
    mocCzk?: number | null;
    motor?: string;
    akku?: string;
};

const sanitize = (v?: string) => (v ?? '').toString().trim();

export default function SimpleBikeCard({ bike }: { bike: SimpleBikeCardProps }) {
    return (
        <Link href={`/catalog/${bike.id}`} className="group block h-full">
            <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="aspect-[4/3] relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors">
                    {bike.bild1 ? (
                        <Image
                            src={getOptimizedImageUrl(bike.bild1, 'large', bike.marke)}
                            alt={`${sanitize(bike.marke)} ${sanitize(bike.modell)}`}
                            fill
                            className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                            Foto není k dispozici
                        </div>
                    )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                        {sanitize(bike.marke)}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                        {sanitize(bike.modell)}
                    </h3>

                    {(bike.motor || bike.akku) && (
                        <div className="flex flex-wrap gap-2 mb-4 text-xs text-zinc-500">
                            {bike.motor && <span className="bg-zinc-100 px-2 py-1 rounded">{bike.motor}</span>}
                            {bike.akku && <span className="bg-zinc-100 px-2 py-1 rounded">{bike.akku}</span>}
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                        <div className="text-lg font-bold text-zinc-900">
                            {typeof bike.mocCzk === 'number' && bike.mocCzk > 0 ? (
                                new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(bike.mocCzk)
                            ) : (
                                <span className="text-zinc-400 text-sm font-normal">Cena na vyžádání</span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 flex items-center">
                            Detail
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
