'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bike } from '@/components/catalog/BikeCard';
import { FilterSidebar } from '@/components/catalog/FilterSidebar';
import { ProductGrid } from '@/components/catalog/ProductGrid';

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Data State
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [moseOptions, setMoseOptions] = useState<string[]>([]);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [mose, setMose] = useState('');
  const [year, setYear] = useState('');
  const [ebikeOnly, setEbikeOnly] = useState<'all' | 'ebike' | 'non'>('ebike');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const pageSize = 24;

  // Initialize state from URL params
  useEffect(() => {
    if (!searchParams) return;
    const q = new URLSearchParams(searchParams as unknown as URLSearchParams);

    setSearch(q.get('search') ?? '');
    setCategory(q.get('category') ?? '');
    setSize(q.get('size') ?? '');
    setMose(q.get('mose') ?? '');
    setYear(q.get('year') ?? '');
    setInStockOnly(q.get('inStock') === 'true');

    const qEbike = q.get('ebike');
    setEbikeOnly(qEbike === 'true' ? 'ebike' : (qEbike === 'false' ? 'non' : 'all'));

    setPage(Number(q.get('page') ?? '1') || 1);
    setViewMode((q.get('view') === 'list' ? 'list' : 'grid') as 'grid' | 'list');

    setHydratedFromUrl(true);
  }, [searchParams]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Push state to URL
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (size) params.set('size', size);
    if (mose) params.set('mose', mose);
    if (year) params.set('year', year);
    if (ebikeOnly === 'ebike') params.set('ebike', 'true');
    if (ebikeOnly === 'non') params.set('ebike', 'false');
    if (inStockOnly) params.set('inStock', 'true');
    if (viewMode === 'list') params.set('view', 'list');
    if (page > 1) params.set('page', String(page));

    const next = params.toString();
    const current = searchParams?.toString() ?? '';
    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
  }, [debouncedSearch, category, size, mose, year, ebikeOnly, inStockOnly, page, viewMode, hydratedFromUrl, pathname, router, searchParams]);

  // Fetch Data
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (size) params.set('size', size);
      if (mose) params.set('mose', mose);
      if (year) params.set('year', year);
      if (ebikeOnly === 'ebike') params.set('ebike', 'true');
      if (ebikeOnly === 'non') params.set('ebike', 'false');
      if (inStockOnly) params.set('inStock', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      try {
        const res = await fetch(`/api/catalog?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setBikes(data.bikes ?? []);
          setCategories(data.categories ?? []);
          setSizeOptions(data.sizeOptions ?? []);
          setMoseOptions(data.moseOptions ?? []);
          setYearOptions((data.yearOptions ?? []).map(String));
          setTotal(Number(data.total ?? 0));
          setTotalPages(Number(data.totalPages ?? 1) || 1);
          setLoading(false);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.warn('Catalog fetch failed', err);
      }
    };

    load();
    return () => controller.abort();
  }, [debouncedSearch, category, size, mose, year, ebikeOnly, inStockOnly, page, hydratedFromUrl]);

  // Reset page on filter change
  useEffect(() => {
    if (!hydratedFromUrl) return;
    setPage(1);
  }, [debouncedSearch, category, size, mose, year, ebikeOnly, inStockOnly, hydratedFromUrl]);

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
            <FilterSidebar
              categories={categories}
              sizeOptions={sizeOptions}
              moseOptions={moseOptions}
              yearOptions={yearOptions}
              selectedCategory={category}
              selectedSize={size}
              selectedMose={mose}
              selectedYear={year}
              ebikeOnly={ebikeOnly}
              inStockOnly={inStockOnly}
              setCategory={setCategory}
              setSize={setSize}
              setMose={setMose}
              setYear={setYear}
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
              <FilterSidebar
                categories={categories}
                sizeOptions={sizeOptions}
                moseOptions={moseOptions}
                yearOptions={yearOptions}
                selectedCategory={category}
                selectedSize={size}
                selectedMose={mose}
                selectedYear={year}
                ebikeOnly={ebikeOnly}
                inStockOnly={inStockOnly}
                setCategory={setCategory}
                setSize={setSize}
                setMose={setMose}
                setYear={setYear}
                setEbikeOnly={setEbikeOnly}
                setInStockOnly={setInStockOnly}
                total={total}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  className="bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-primary focus:border-primary block w-full pl-10 p-3 shadow-sm"
                  placeholder="Hledat model, barvu, kód..."
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500 hidden sm:inline-block">{total} produktů</span>
                <div className="bg-white border border-zinc-200 rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <ProductGrid
              bikes={bikes}
              loading={loading}
              viewMode={viewMode}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
            />
          </div>

        </div>
      </div>
    </main>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}
