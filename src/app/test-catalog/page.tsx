'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

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

export default function TestCatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDocs(collection(db, 'products_v2'));
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
                setProducts(data);
            } catch (e) {
                console.error('Error loading products', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="p-8 text-center">Načítám testovací katalog...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8">Testovací Katalog (v2 Import)</h1>
            <p className="mb-8 text-gray-600">
                Celkem produktů: {products.length} (unikátní modely)<br />
                Data importována z CSV. Zobrazuji seskupené varianty.
            </p>

            <div className="grid grid-cols-1 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div
                            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6"
                            onClick={() => setExpanded(expanded === product.id ? null : product.id)}
                        >
                            {/* Image Preview */}
                            <div className="w-full md:w-48 aspect-[4/3] relative bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                {product.images[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.model}
                                        fill
                                        className="object-contain mix-blend-multiply"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Bez foto</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">{product.brand}</span>
                                        <h2 className="text-xl font-bold text-gray-900 mt-1">{product.model}</h2>
                                        <p className="text-gray-500 text-sm">{product.category} • {product.year}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {product.minPrice === product.maxPrice
                                                ? `${product.minPrice.toLocaleString('cs-CZ')} Kč`
                                                : `${product.minPrice.toLocaleString('cs-CZ')} - ${product.maxPrice.toLocaleString('cs-CZ')} Kč`
                                            }
                                        </p>
                                        <p className="text-xs text-gray-500">{product.variants.length} variant</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="block text-xs text-gray-400">Motor</span>
                                        {product.specs.motor || '-'}
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400">Baterie</span>
                                        {product.specs.capacity || '-'}
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400">Materiál</span>
                                        {product.specs.frameMaterial || '-'}
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400">Kola</span>
                                        {product.specs.wheelSize || '-'} / {product.specs.tireSize || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Variants Table */}
                        {expanded === product.id && (
                            <div className="border-t border-gray-200 bg-gray-50 p-6">
                                <h3 className="font-bold mb-4 text-sm uppercase text-gray-500">Varianty</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2">SKU</th>
                                                <th className="px-4 py-2">Barva</th>
                                                <th className="px-4 py-2">Velikost</th>
                                                <th className="px-4 py-2">Rám</th>
                                                <th className="px-4 py-2">Cena</th>
                                                <th className="px-4 py-2">Obrázek</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {product.variants.map(variant => (
                                                <tr key={variant.id} className="border-b border-gray-200 hover:bg-white">
                                                    <td className="px-4 py-2 font-mono text-xs">{variant.id}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="inline-block w-3 h-3 rounded-full mr-2 border border-gray-300" style={{ backgroundColor: 'gray' }}></span>
                                                        {variant.color}
                                                    </td>
                                                    <td className="px-4 py-2 font-bold">{variant.size}</td>
                                                    <td className="px-4 py-2">{variant.frameShape}</td>
                                                    <td className="px-4 py-2">{variant.price.toLocaleString('cs-CZ')} Kč</td>
                                                    <td className="px-4 py-2">
                                                        {variant.images[0] ? (
                                                            <a href={variant.images[0]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                                Zobrazit
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
