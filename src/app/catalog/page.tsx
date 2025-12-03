/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMose, setSelectedMose] = useState<string>('');
    const [selectedMohe, setSelectedMohe] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [ebikeOnly, setEbikeOnly] = useState<'all' | 'ebike' | 'non'>('ebike');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [initialized, setInitialized] = useState(false);

    // UI State
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Initialize from URL (runs once on mount)
    useEffect(() => {
        if (!searchParams || initialized) return;
        setSelectedCategory(searchParams.get('category') || '');
        setSelectedYear(searchParams.get('year') || '');
        setSelectedMose(searchParams.get('mose') || '');
        setSelectedMohe(searchParams.get('mohe') || '');
        setSelectedSize(searchParams.get('size') || '');
        setInStockOnly(searchParams.get('inStock') === 'true');
        setSearch(searchParams.get('search') || '');
        setPage(Number(searchParams.get('page')) || 1);

        const qEbike = searchParams.get('ebike');
        setEbikeOnly(qEbike === 'true' ? 'ebike' : (qEbike === 'false' ? 'non' : 'ebike'));

        setInitialized(true);
    }, [searchParams, initialized]);

    // Update URL on filter change (only after initialization)
    useEffect(() => {
        if (!initialized) return; // Don't sync to URL until we've read from URL first

        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedYear) params.set('year', selectedYear);
        if (selectedMose) params.set('mose', selectedMose);
        if (selectedMohe) params.set('mohe', selectedMohe);
        if (selectedSize) params.set('size', selectedSize);
        if (inStockOnly) params.set('inStock', 'true');
        if (ebikeOnly === 'ebike') params.set('ebike', 'true');
        if (ebikeOnly === 'non') params.set('ebike', 'false');
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (page > 1) params.set('page', String(page));

        const next = params.toString();
        const current = searchParams?.toString() || '';

        if (next !== current) {
            router.replace(`${pathname}?${next}`, { scroll: false });
        }
        // Removed searchParams, pathname, router from dependency array to prevent infinite loops
        // This effect is now strictly for synchronizing STATE -> URL
        // The other effect handles URL -> STATE
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, selectedCategory, selectedMose, selectedMohe, selectedYear, selectedSize, inStockOnly, ebikeOnly, debouncedSearch, page]);

    // Reset page on filter change (except pagination itself)
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, selectedMose, selectedMohe, selectedYear, selectedSize, inStockOnly, ebikeOnly, debouncedSearch]);

    // Fetch Data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', page.toString());
                params.set('pageSize', '24');
                if (debouncedSearch) params.set('search', debouncedSearch);
                if (selectedCategory) params.set('category', selectedCategory);
                if (selectedYear) params.set('year', selectedYear);
                if (selectedMose) params.set('mose', selectedMose);
                if (selectedMohe) params.set('mohe', selectedMohe);
                if (selectedSize) params.set('size', selectedSize);
                if (ebikeOnly === 'ebike') params.set('ebike', 'true');
                if (ebikeOnly === 'non') params.set('ebike', 'false');
                if (inStockOnly) params.set('inStock', 'true');

                const res = await fetch(`/api/catalog?${params.toString()}`, { cache: 'no-store' });
                const data = await res.json();

                if (data.error) {
                    console.error('API Error:', data.error);
                    setProducts([]);
                    setFilters({});
                    setTotal(0);
                    setTotalPages(1);
                } else {
                    setProducts(data.products || []);
                    setFilters(data.filters || {});
                    setTotal(data.pagination?.total || 0);
                    setTotalPages(data.pagination?.totalPages || 1);
                }
            } catch (e) {
                console.error(e);
                setProducts([]);
                setFilters({});
                setTotal(0);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedCategory, selectedMose, selectedMohe, selectedYear, selectedSize, inStockOnly, ebikeOnly, debouncedSearch, page]);

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
                            moseOptions={filters.moseOptions || []}
                            moheOptions={filters.moheOptions || []}
                            selectedCategory={selectedCategory}
                            selectedMose={selectedMose}
                            selectedMohe={selectedMohe}
                            ebikeOnly={ebikeOnly}
                            inStockOnly={inStockOnly}
                            setCategory={setSelectedCategory}
                            setMose={setSelectedMose}
                            setMohe={setSelectedMohe}
                            setEbikeOnly={setEbikeOnly}
                            setInStockOnly={setInStockOnly}
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
                                moseOptions={filters.moseOptions || []}
                                moheOptions={filters.moheOptions || []}
                                selectedCategory={selectedCategory}
                                selectedMose={selectedMose}
                                selectedMohe={selectedMohe}
                                ebikeOnly={ebikeOnly}
                                inStockOnly={inStockOnly}
                                setCategory={setSelectedCategory}
                                setMose={setSelectedMose}
                                setMohe={setSelectedMohe}
                                setEbikeOnly={setEbikeOnly}
                                setInStockOnly={setInStockOnly}
                                total={total}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-primary focus:border-primary block w-full pl-10 p-3 shadow-sm"
                                    placeholder="Hledat model, barvu, kód..."
                                />
                            </div>
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
                                            onClick={() => {
                                                setSelectedCategory('');
                                                setSelectedMose('');
                                                setSelectedMohe('');
                                                setSelectedYear('');
                                                setSelectedSize('');
                                                setInStockOnly(false);
                                                setEbikeOnly('ebike');
                                                setSearch('');
                                            }}
                                            className="mt-4 text-primary font-medium hover:underline"
                                        >
                                            Vymazat filtry
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            {products.map(product => (
                                                <ProductCardV2
                                                    key={product._uniqueKey || product.id}
                                                    product={product}
                                                />
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="px-4 py-2 border border-zinc-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                                                >
                                                    Předchozí
                                                </button>
                                                <span className="px-4 py-2 text-sm text-zinc-600 flex items-center">
                                                    Strana {page} z {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="px-4 py-2 border border-zinc-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                                                >
                                                    Další
                                                </button>
                                            </div>
                                        )}
                                    </>
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
