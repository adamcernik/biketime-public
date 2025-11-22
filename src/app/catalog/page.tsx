'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const sanitize = (v?: string) => {
  const s = (v ?? '').toString().trim();
  const lower = s.toLowerCase();
  if (lower === 'unknown manual entry required') return '';
  if (lower === 'unknown') return '';
  if (lower === 'manual entry required') return '';
  return s;
};

interface Bike {
  id: string;
  nrLf?: string;
  marke?: string;
  modell?: string;
  bild1?: string;
  motor?: string;
  akku?: string;
  ['Categorie (PRGR)']?: string;
  categoriePrgr?: string;
  sizes?: string[];
  capacitiesWh?: number[];
  b2bStockQuantity?: number;
  stockSizes?: string[];
  onTheWaySizes?: string[];
  mocCzk?: number;
  priceLevelsCzk?: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', number>>;
  mose?: string;
  variants?: { id: string; color: string; image: string; nrLf: string }[];
}

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [moseOptions, setMoseOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [mose, setMose] = useState('');
  const [ebikeOnly, setEbikeOnly] = useState<'all' | 'ebike' | 'non'>('ebike');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [year, setYear] = useState('');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    if (!searchParams) return;
    const q = new URLSearchParams(searchParams as unknown as URLSearchParams);
    const qSearch = q.get('search') ?? '';
    const qCategory = q.get('category') ?? '';
    const qSize = q.get('size') ?? '';
    const qMose = q.get('mose') ?? '';
    const qYear = q.get('year') ?? '';
    const qInStock = q.get('inStock') === 'true';
    const qEbike = q.get('ebike');
    const qPage = Number(q.get('page') ?? '1') || 1;
    const qView = (q.get('view') === 'list' ? 'list' : 'grid') as 'grid' | 'list';
    const eb: 'all' | 'ebike' | 'non' =
      qEbike === 'true' ? 'ebike' : (qEbike === 'false' ? 'non' : 'all');

    setSearch((prev) => (prev !== qSearch ? qSearch : prev));
    setCategory((prev) => (prev !== qCategory ? qCategory : prev));
    setSize((prev) => (prev !== qSize ? qSize : prev));
    setMose((prev) => (prev !== qMose ? qMose : prev));
    setYear((prev) => (prev !== qYear ? qYear : prev));
    setInStockOnly((prev) => (prev !== qInStock ? qInStock : prev));
    setEbikeOnly((prev) => (prev !== eb ? eb : prev));
    setPage((prev) => (prev !== qPage ? qPage : prev));
    setViewMode((prev) => (prev !== qView ? qView : prev));
    setHydratedFromUrl(true);
  }, [searchParams]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Push state to URL (use debouncedSearch instead of search)
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (size) params.set('size', size);
    if (mose) params.set('mose', mose);
    if (ebikeOnly === 'ebike') params.set('ebike', 'true');
    if (ebikeOnly === 'non') params.set('ebike', 'false');
    if (year) params.set('year', year);
    if (inStockOnly) params.set('inStock', 'true');
    if (viewMode === 'list') params.set('view', 'list');
    if (page > 1) params.set('page', String(page));
    const next = params.toString();
    const current = searchParams?.toString() ?? '';
    if (next !== current) {
      const url = next ? `${pathname}?${next}` : pathname;
      router.replace(url, { scroll: false });
    }
  }, [debouncedSearch, category, size, mose, ebikeOnly, year, inStockOnly, page, viewMode, hydratedFromUrl]);

  // Fetch data (use debouncedSearch)
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const controller = new AbortController();
    const { signal } = controller;
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category) params.set('category', category);
      if (size) params.set('size', size);
      if (mose) params.set('mose', mose);
      if (ebikeOnly === 'ebike') params.set('ebike', 'true');
      if (ebikeOnly === 'non') params.set('ebike', 'false');
      if (year) params.set('year', year);
      if (inStockOnly) params.set('inStock', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      try {
        const res = await fetch(`/api/catalog?${params.toString()}`, { signal });
        const data = await res.json();
        if (!signal.aborted) {
          setBikes((data.bikes ?? []) as Bike[]);
          setCategories((data.categories ?? []) as string[]);
          setSizeOptions((data.sizeOptions ?? []) as string[]);
          setMoseOptions((data.moseOptions ?? []) as string[]);
          setTags((data.categories ?? []) as string[]);
          setYearOptions(((data.yearOptions ?? []) as number[]).map(String));
          setTotal(Number(data.total ?? 0));
          setTotalPages(Number(data.totalPages ?? 1) || 1);
          if (Number(data.page) && data.page !== page) setPage(Number(data.page));
          setLoading(false);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.warn('Catalog fetch failed', err);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [debouncedSearch, category, size, mose, ebikeOnly, year, inStockOnly, page, hydratedFromUrl]);

  // Reset page on filter change (use debouncedSearch)
  useEffect(() => {
    if (!hydratedFromUrl) return;
    setPage(1);
  }, [debouncedSearch, category, size, mose, ebikeOnly, year, inStockOnly, hydratedFromUrl]);

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Header / Filters */}
      <div className="bg-white border-b border-zinc-200 sticky top-[56px] z-30 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex justify-between items-center">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 px-4 py-2 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filtry
              </button>
              <span className="text-sm text-zinc-500">{total} kol</span>
            </div>

            {/* Desktop Filters */}
            <div className={`flex-col lg:flex-row lg:flex items-center gap-4 ${mobileFiltersOpen ? 'flex' : 'hidden'}`}>
              {/* Type Toggle */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-lg">
                <button
                  onClick={() => setEbikeOnly('ebike')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ebikeOnly === 'ebike' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >E-Bike</button>
                <button
                  onClick={() => setEbikeOnly('non')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ebikeOnly === 'non' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >Kolo</button>
                <button
                  onClick={() => setEbikeOnly('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ebikeOnly === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >Vše</button>
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={mose}
                  onChange={(e) => setMose(e.target.value)}
                  className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 max-w-[180px]"
                >
                  <option value="">Modelová řada</option>
                  {moseOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                >
                  <option value="">Velikost</option>
                  {sizeOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                >
                  <option value="">Rok</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-zinc-50 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-zinc-700">Skladem</span>
                </label>
              </div>
            </div>

            {/* Search & View Toggle */}
            <div className={`flex items-center gap-3 ${mobileFiltersOpen ? 'mt-4 lg:mt-0' : ''}`}>
              <div className="relative flex-1 lg:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
                  placeholder="Hledat model..."
                />
              </div>

              <div className="hidden sm:flex bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Categories Tags */}
          {!!tags.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map(t => (
                <button
                  key={t}
                  onClick={() => setCategory(category === t ? '' : t)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${category === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse border border-zinc-100" />
            ))}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}>
              {bikes.map((b) => <BikeCard key={b.id} bike={b} viewMode={viewMode} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Předchozí
                </button>
                <span className="text-sm font-medium text-zinc-600">
                  Strana {page} z {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Další
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function BikeCard({ bike, viewMode }: { bike: Bike; viewMode: 'grid' | 'list' }) {
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

  // Determine display NRLF
  const displayNrLf = activeVariant.nrLf || bike.nrLf;

  return (
    <div className={`group block bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col h-full'}`}>
      <Link href={`/catalog/${activeVariantId}`} className="block w-full">
        {/* Image Area */}
        <div className={`relative bg-zinc-50 group-hover:bg-zinc-100 transition-colors ${viewMode === 'grid' ? 'aspect-[4/3] p-6' : 'w-48 h-32 shrink-0 rounded-lg'}`}>
          {displayImage ? (
            <Image
              src={displayImage}
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

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}


