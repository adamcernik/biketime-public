'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

export default function InStockPage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      setLoading(true);
      const collected: Bike[] = [];
      let page = 1;
      const pageSize = 500;
      while (true) {
        const params = new URLSearchParams();
        params.set('inStock', 'true');
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        // Intentionally omit 'year' to include all years
        const res = await fetch(`/api/catalog?${params.toString()}`);
        const data = await res.json();
        const chunk = (data.bikes ?? []) as Bike[];
        collected.push(...chunk);
        const totalPages = Number(data.totalPages ?? 1) || 1;
        if (page >= totalPages) break;
        page += 1;
      }
      if (!cancelled) {
        setBikes(collected);
        setLoading(false);
      }
    };
    void loadAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Kola Bulls, která máme ihned k odběru v ČR
          </h1>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
              Celkem {bikes.length} položek skladem
            </p>
          )}
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-gray-600">Načítám...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {bikes.map((b) => (
              <Link
                key={b.id}
                href={`/catalog/${b.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
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
                  {(() => {
                    const repSize = ((b.nrLf ?? '') as string).toString().match(/(\d{2})$/)?.[1];
                    const hasRepSizeInStock = repSize ? (b.stockSizes ?? []).includes(repSize) : (b.stockSizes ?? []).length > 0;
                    return hasRepSizeInStock;
                  })() && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-green-600 text-white">SKLADEM</span>
                  )}
                </div>
                <div className="p-3">
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
      </section>
    </main>
  );
}


