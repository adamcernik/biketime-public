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

function AccessoriesContent() {
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const searchQuery = React.useMemo(() => {
    const t = search.trim();
    return t.length >= 3 ? t : '';
  }, [search]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    } else if (group) {
      params.set('group', group);
    }
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    fetch(`/api/accessories?${params.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { items: Accessory[]; total?: number; page?: number; totalPages?: number };
        setItems(data.items || []);
        if (typeof data.total === 'number') setTotal(data.total);
        if (typeof data.totalPages === 'number') setTotalPages(data.totalPages);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [searchQuery, group, page]);

  const CHIP_ORDER = ['osvětlení', 'láhve a košíky', 'zámky', 'elektronika', 'blatníky', 'sedlovky', 'představce'] as const;
  const types = CHIP_ORDER as unknown as string[];

  // no-op

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Monkey Link příslušenství</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat příslušenství..."
              className="rounded px-3 h-10 text-sm w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-4 py-6">
        {!!types.length && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => { setGroup(''); setPage(1); }}
              className={`text-xs px-3 py-1 rounded-full ring-1 ring-gray-300 ${group===''? 'bg-black text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
              title="Vše"
            >
              Vše
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => { setGroup(t); setPage(1); }}
                className={`text-xs px-3 py-1 rounded-full ring-1 ring-gray-300 ${group===t? 'bg-black text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                title={t}
              >{t}</button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="text-gray-600">Načítám...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((p) => (
              <Link key={p.id} href={`/prislusenstvi/${p.id}`} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square relative bg-white">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={`${p.marke ?? ''} ${p.produkt ?? p.modell ?? ''}`.trim()}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Bez foto</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs text-gray-500 font-mono">{p.nrLf || p.ean}</div>
                  <div className="font-semibold">{[p.marke, p.produkt || p.modell].filter(Boolean).join(' ')}</div>
                  <div className="text-xs text-gray-600 mt-1">{[p.categorie, p.productType].filter(Boolean).join(' · ')}</div>
                  {p.farbe ? <div className="text-xs text-gray-500 mt-1">{p.farbe}</div> : null}
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

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50"><section className="max-w-5xl mx-auto px-4 py-6 text-gray-600">Načítám...</section></main>}>
      <AccessoriesContent />
    </Suspense>
  );
}


