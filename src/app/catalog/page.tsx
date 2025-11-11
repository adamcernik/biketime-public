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
  mocCzk?: number;
  priceLevelsCzk?: Partial<Record<'A'|'B'|'C'|'D'|'E'|'F', number>>;
}

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // kept for future UI filters
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
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

  // Initialize state from URL params and keep in sync on back/forward
  useEffect(() => {
    if (!searchParams) return;
    const q = new URLSearchParams(searchParams as unknown as URLSearchParams);
    const qSearch = q.get('search') ?? '';
    const qCategory = q.get('category') ?? '';
    const qSize = q.get('size') ?? '';
    const qYear = q.get('year') ?? '';
    const qInStock = q.get('inStock') === 'true';
    const qEbike = q.get('ebike');
    const qPage = Number(q.get('page') ?? '1') || 1;
    const qView = (q.get('view') === 'list' ? 'list' : 'grid') as 'grid' | 'list';
    const eb: 'all' | 'ebike' | 'non' =
      qEbike === 'true' ? 'ebike' : (qEbike === 'false' ? 'non' : 'all');
    // Only update when different to avoid loops
    setSearch((prev) => (prev !== qSearch ? qSearch : prev));
    setCategory((prev) => (prev !== qCategory ? qCategory : prev));
    setSize((prev) => (prev !== qSize ? qSize : prev));
    setYear((prev) => (prev !== qYear ? qYear : prev));
    setInStockOnly((prev) => (prev !== qInStock ? qInStock : prev));
    setEbikeOnly((prev) => (prev !== eb ? eb : prev));
    setPage((prev) => (prev !== qPage ? qPage : prev));
    setViewMode((prev) => (prev !== qView ? qView : prev));
    setHydratedFromUrl(true);
  }, [searchParams]);

  // Push state to URL (replace) so filters are shareable and preserved on back
  useEffect(() => {
    if (!hydratedFromUrl) return; // avoid wiping URL before we read it
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (size) params.set('size', size);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, size, ebikeOnly, year, inStockOnly, page, viewMode, hydratedFromUrl]);

  useEffect(() => {
    if (!hydratedFromUrl) return;
    const controller = new AbortController();
    const { signal } = controller;
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (size) params.set('size', size);
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
          setTags((data.categories ?? []) as string[]);
          setYearOptions(((data.yearOptions ?? []) as number[]).map(String));
          setTotal(Number(data.total ?? 0));
          setTotalPages(Number(data.totalPages ?? 1) || 1);
          if (Number(data.page) && data.page !== page) setPage(Number(data.page));
          setLoading(false);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          // eslint-disable-next-line no-console
          console.warn('Catalog fetch failed', err);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [search, category, size, ebikeOnly, year, inStockOnly, page, hydratedFromUrl]);

  // Reset to first page when filters change
  useEffect(() => {
    if (!hydratedFromUrl) return;
    setPage(1);
  }, [search, category, size, ebikeOnly, year, inStockOnly, hydratedFromUrl]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm gap-1 rounded px-2 py-1 bg-gray-100">
              <button
                onClick={()=>setEbikeOnly('ebike')}
                className={`px-2 py-1 rounded ${ebikeOnly==='ebike'?'bg-black text-white':'text-gray-700 hover:bg-gray-200'}`}
              >E‑bike</button>
              <button
                onClick={()=>setEbikeOnly('non')}
                className={`px-2 py-1 rounded ${ebikeOnly==='non'?'bg-black text-white':'text-gray-700 hover:bg-gray-200'}`}
              >Bez motoru</button>
              <button
                onClick={()=>setEbikeOnly('all')}
                className={`px-2 py-1 rounded ${ebikeOnly==='all'?'bg-black text-white':'text-gray-700 hover:bg-gray-200'}`}
              >Vše</button>
            </div>
            <label className="inline-flex items-center gap-2 bg-white rounded px-3 h-10 text-sm shadow-sm cursor-pointer" title="Zobrazit pouze kola skladem">
              <input type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)} />
              <span>Skladem</span>
            </label>
            <div className="relative">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="appearance-none bg-white rounded px-3 pr-8 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              >
                <option value="">Všechny velikosti</option>
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
              </span>
            </div>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="appearance-none bg-white rounded px-3 pr-8 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              >
                <option value="">Všechny roky</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 rounded bg-white shadow-sm">
              <button
                type="button"
                aria-label="Zobrazit mřížku"
                className={`px-2 py-1 ${viewMode==='grid'?'text-black':'text-gray-500'}`}
                onClick={()=>setViewMode('grid')}
                title="Mřížka"
              >
                ▦
              </button>
              <button
                type="button"
                aria-label="Zobrazit seznam"
                className={`px-2 py-1 ${viewMode==='list'?'text-black':'text-gray-500'}`}
                onClick={()=>setViewMode('list')}
                title="Seznam"
              >
                ≡
              </button>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat kola..."
              className="rounded px-3 h-10 text-sm w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-4 py-6">
        {!!tags.length && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map(t => (
              <button
                key={t}
                onClick={() => setCategory(t)}
                className={`text-xs px-3 py-1 rounded-full ring-1 ring-gray-300 ${category===t? 'bg-black text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
              >{t}</button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="text-gray-600">Načítám...</div>
        ) : (
          <div className={viewMode==='grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
            {bikes.map((b) => (
              <Link
                key={b.id}
                href={`/catalog/${b.id}`}
                className={viewMode==='grid' ? 'bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow' : 'flex items-center gap-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3'}
              >
                {viewMode==='grid' ? (
                  <div className="aspect-square relative bg-white">
                    {b.bild1 ? (
                      <Image
                        src={b.bild1}
                        alt={`${sanitize(b.marke)} ${sanitize(b.modell)}`.trim()}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Zatím není k dispozici foto</div>
                    )}
                    {(b.stockSizes ?? []).length > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-green-600 text-white">SKLADEM</span>
                    )}
                  </div>
                ) : (
                  <div className="relative w-28 h-28 bg-white flex items-center justify-center">
                    {b.bild1 ? (
                      <Image
                        src={b.bild1}
                        alt={`${sanitize(b.marke)} ${sanitize(b.modell)}`.trim()}
                        fill
                        sizes="112px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="text-gray-500 text-xs">Bez foto</div>
                    )}
                    {(b.stockSizes ?? []).length > 0 && (
                      <span className="absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded bg-green-600 text-white">SKLADEM</span>
                    )}
                  </div>
                )}
                <div className={viewMode==='grid' ? 'p-3' : 'flex-1'}>
                  <div className="text-xs text-gray-500 font-mono">{b.nrLf}</div>
                  <div className="font-semibold">{[sanitize(b.marke), sanitize(b.modell)].filter(Boolean).join(' ')}</div>
                  {(() => {
                    const hasMoc = typeof b.mocCzk === 'number' && b.mocCzk > 0;
                    if (!hasMoc) return null;
                    return (
                      <div className="mt-1">
                        <div className="text-xl font-bold text-green-700">
                          {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(b.mocCzk as number)}
                        </div>
                      </div>
                    );
                  })()}
                  {(b.motor || b.akku) && (
                    <div className="text-xs text-gray-600 mt-1">
                      {b.motor}
                      {b.motor && b.akku ? ', ' : ''}
                      {b.akku}
                    </div>
                  )}
                  {!!b.sizes?.length && (
                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
                      {b.sizes.map((s) => {
                        const inStock = (b.stockSizes ?? []).includes(s);
                        return (
                          <span key={s} className={`px-2 py-0.5 rounded-full ring-1 ${inStock ? 'ring-green-600 bg-green-50 text-green-800' : 'ring-gray-300 bg-white text-gray-800'}`}>{s}</span>
                        );
                      })}
                    </div>
                  )}
                  {!!b.capacitiesWh?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {b.capacitiesWh.map((w) => (
                        <span key={w} className="text-xs px-2 py-0.5 rounded-full ring-1 ring-gray-300 bg-white text-gray-800">{w} Wh</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{(b['Categorie (PRGR)'] ?? b.categoriePrgr ?? '') as string}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {(() => {
                const start = (page - 1) * pageSize + 1;
                const end = Math.min(total, page * pageSize);
                return `Zobrazeno ${start}–${end} z ${total}`;
              })()}
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`px-3 py-2 text-sm rounded ring-1 ${page <= 1 ? 'ring-gray-200 text-gray-400 bg-white' : 'ring-gray-300 text-gray-700 bg-white hover:bg-gray-100'}`}
                aria-label="Předchozí strana"
              >
                Předchozí
              </button>
              <span className="text-sm text-gray-600">Strana {page} z {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`px-3 py-2 text-sm rounded ring-1 ${page >= totalPages ? 'ring-gray-200 text-gray-400 bg-white' : 'ring-gray-300 text-gray-700 bg-white hover:bg-gray-100'}`}
                aria-label="Další strana"
              >
                Další
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50"><section className="max-w-5xl mx-auto px-4 py-6 text-gray-600">Načítám...</section></main>}>
      <CatalogContent />
    </Suspense>
  );
}


