'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Accessory = {
  id: string;
  nrLf?: string;
  ean?: string;
  produkt?: string;
  marke?: string;
  modell?: string;
  farbe?: string;
  modelljahr?: number | null;
  image?: string;
  categorie?: string;
  productType?: string;
};

import { AccessoryFilterSidebar } from '@/components/catalog/AccessoryFilterSidebar';

function AccessoriesContent() {
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Filter Options
  const [filterOptions, setFilterOptions] = useState<{ brands: string[], categories: string[] }>({ brands: [], categories: [] });

  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory) params.set('group', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);

    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    fetch(`/api/accessories?${params.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setItems(data.items || []);
        if (typeof data.total === 'number') setTotal(data.total);
        if (typeof data.totalPages === 'number') setTotalPages(data.totalPages);
        if (data.filters) setFilterOptions(data.filters);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [debouncedSearch, selectedCategory, selectedBrand, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedBrand]);

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
        <span className="text-sm text-zinc-500">{total} produktů</span>
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
            <AccessoryFilterSidebar
              categories={filterOptions.categories}
              brands={filterOptions.brands}
              selectedCategory={selectedCategory}
              selectedBrand={selectedBrand}
              setCategory={setSelectedCategory}
              setBrand={setSelectedBrand}
              total={total}
            />
          </div>
          <div className="p-4 border-t border-zinc-100">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl"
            >
              Zobrazit {total} produktů
            </button>
          </div>
        </div>
      )}

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar pb-10">
              <AccessoryFilterSidebar
                categories={filterOptions.categories}
                brands={filterOptions.brands}
                selectedCategory={selectedCategory}
                selectedBrand={selectedBrand}
                setCategory={setSelectedCategory}
                setBrand={setSelectedBrand}
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
                  placeholder="Hledat příslušenství..."
                />
              </div>
              <span className="text-sm text-zinc-500">{total} produktů</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-[300px] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded-xl">{error}</div>
            ) : (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200">
                    <p className="text-zinc-400 text-lg">Nebyly nalezeny žádné produkty.</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedBrand('');
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
                      {items.map((p) => (
                        <Link key={p.id} href={`/prislusenstvi/${p.id}`} className="group block h-full">
                          <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                            <div className="aspect-square relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors overflow-hidden">
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={`${p.marke ?? ''} ${p.produkt ?? p.modell ?? ''}`.trim()}
                                  fill
                                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                  className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-95"
                                  unoptimized
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-sm">Bez foto</div>
                              )}
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                              <div className="mb-2">
                                <span className="text-xs font-bold text-primary tracking-wider uppercase">{p.marke}</span>
                              </div>
                              <h3 className="text-sm font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {[p.produkt || p.modell].filter(Boolean).join(' ')}
                              </h3>
                              <div className="text-xs text-zinc-500 mt-auto">
                                {[p.categorie, p.productType].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </div>
                        </Link>
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

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50"><section className="max-w-5xl mx-auto px-4 py-6 text-gray-600">Načítám...</section></main>}>
      <AccessoriesContent />
    </Suspense>
  );
}


