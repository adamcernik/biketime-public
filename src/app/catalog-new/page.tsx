'use client';

import { useState, useEffect, Suspense } from 'react';
import ProductCardV2 from '@/components/ProductCardV2';
import { FilterSidebarV2 } from '@/components/catalog/FilterSidebarV2';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function CatalogNewContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<any[]>([]);
    const [filters, setFilters] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Active filters state
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');

    // UI State
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [total, setTotal] = useState(0);

    // Initialize from URL
    useEffect(() => {
        if (!searchParams) return;
        setSelectedCategory(searchParams.get('category') || '');
        setSelectedBrand(searchParams.get('brand') || '');
        setSelectedYear(searchParams.get('year') || '');
    }, [searchParams]);

    // Update URL on filter change
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedBrand) params.set('brand', selectedBrand);
        if (selectedYear) params.set('year', selectedYear);

        const next = params.toString();
        const current = searchParams?.toString() || '';

        if (next !== current) {
            router.replace(`${pathname}?${next}`, { scroll: false });
        }
    }, [selectedCategory, selectedBrand, selectedYear, pathname, router, searchParams]);

    // Fetch Data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCategory) params.set('category', selectedCategory);
                if (selectedBrand) params.set('brand', selectedBrand);
                if (selectedYear) params.set('year', selectedYear);

                const res = await fetch(`/api/catalog-v2?${params.toString()}`);
                const data = await res.json();

                if (data.error) {
                    console.error('API Error:', data.error);
                    setProducts([]);
                    setFilters({});
                    setTotal(0);
                } else {
                    setProducts(data.products || []);
                    setFilters(data.filters || {});
                    setTotal(data.pagination?.total || 0);
                }
            } catch (e) {
                console.error(e);
                setProducts([]);
                setFilters({});
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedCategory, selectedBrand, selectedYear]);

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-zinc-200 sticky top-[56px] z-30 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-900 bg-zinc-100 px-4 py-2 rounded-full"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Filtry
                </button>
                <span className="text-sm text-zinc-500">{total} kol</span>
            </div>

            {/* Mobile Filter Modal */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col lg:hidden">
                    <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                        <h2 className="text-lg font-bold">Filtry</h2>
                        <button onClick={() => setMobileFiltersOpen(false)} className="p-2 bg-zinc-100 rounded-full">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <FilterSidebarV2
                            categories={filters.categories || []}
                            brands={filters.brands || []}
                            years={filters.years || []}
                            selectedCategory={selectedCategory}
                            selectedBrand={selectedBrand}
                            selectedYear={selectedYear}
                            setCategory={setSelectedCategory}
                            setBrand={setSelectedBrand}
                            setYear={setSelectedYear}
                            total={total}
                        />
                    </div>
                    <div className="p-4 border-t border-zinc-100">
                        <button
                            onClick={() => setMobileFiltersOpen(false)}
                            className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl"
                        >
                            Zobrazit {total} kol
                        </button>
                    </div>
                </div>
            )}

            <div className="container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar pb-10">
                            <FilterSidebarV2
                                categories={filters.categories || []}
                                brands={filters.brands || []}
                                years={filters.years || []}
                                selectedCategory={selectedCategory}
                                selectedBrand={selectedBrand}
                                selectedYear={selectedYear}
                                setCategory={setSelectedCategory}
                                setBrand={setSelectedBrand}
                                setYear={setSelectedYear}
                                total={total}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-zinc-900">Katalog 2026</h1>
                            <span className="text-sm text-zinc-500">{total} produktů</span>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {products.length === 0 ? (
                                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200">
                                        <p className="text-zinc-400 text-lg">Nebyly nalezeny žádné produkty.</p>
                                        <button
                                            onClick={() => { setSelectedBrand(''); setSelectedCategory(''); setSelectedYear(''); }}
                                            className="mt-4 text-primary font-medium hover:underline"
                                        >
                                            Vymazat filtry
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {products.map(product => (
                                            <ProductCardV2 key={product.id} product={product} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function CatalogNewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <CatalogNewContent />
        </Suspense>
    );
}
