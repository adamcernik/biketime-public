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
}

export default function CatalogPage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // kept for future UI filters
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [ebikeOnly, setEbikeOnly] = useState<'all' | 'ebike' | 'non'>('ebike');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [year, setYear] = useState('2026');
  const [yearOptions, setYearOptions] = useState<string[]>(['2026']);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (size) params.set('size', size);
      if (ebikeOnly === 'ebike') params.set('ebike', 'true');
      if (ebikeOnly === 'non') params.set('ebike', 'false');
      if (year) params.set('year', year);
      const res = await fetch(`/api/catalog?${params.toString()}`);
      const data = await res.json();
      setBikes((data.bikes ?? []) as Bike[]);
      setCategories((data.categories ?? []) as string[]);
      setSizeOptions((data.sizeOptions ?? []) as string[]);
      setTags((data.categories ?? []) as string[]);
      setYearOptions(((data.yearOptions ?? []) as number[]).map(String));
      setLoading(false);
    };
    load();
  }, [search, category, size, ebikeOnly, year]);

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
          <div className="ml-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {bikes.map((b) => (
              <Link key={b.id} href={`/catalog/${b.id}`} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square relative bg-white">
                  {b.bild1 ? (
                    <Image
                      src={b.bild1}
                      alt={`${sanitize(b.marke)} ${sanitize(b.modell)}`.trim()}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                      Zatím není k dispozici foto
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs text-gray-500 font-mono">{b.nrLf}</div>
                  <div className="font-semibold">{[sanitize(b.marke), sanitize(b.modell)].filter(Boolean).join(' ')}</div>
                  {(b.motor || b.akku) && (
                    <div className="text-xs text-gray-600 mt-1">
                      {b.motor}
                      {b.motor && b.akku ? ', ' : ''}
                      {b.akku}
                    </div>
                  )}
                  {!!b.sizes?.length && (
                    <div className="text-xs text-gray-600 mt-1">Velikosti: {b.sizes.join(', ')}</div>
                  )}
                  {!!b.capacitiesWh?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {b.capacitiesWh.map((w) => (
                        <span key={w} className="text-xs px-2 py-0.5 rounded-full ring-1 ring-gray-300 bg-white text-gray-800">
                          {w} Wh
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {(b['Categorie (PRGR)'] ?? b.categoriePrgr ?? '') as string}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


