/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';

type Accessory = {
  id: string;
  lfSn?: string;
  nrLf?: string;
  ean?: string;
  produkt?: string;
  marke?: string;
  modell?: string;
  farbe?: string;
  modelljahr?: number | null;
  uvpPl?: number | null;
  ekPl?: number | null;
  uavpPl?: number | null;
  image?: string;
  productType?: string;
  categorie?: string;
};

type ListResponse = { count: number; items: Accessory[] };

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  try {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}

export default function MonkeyLinkPage() {
  const [search, setSearch] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [year, setYear] = React.useState('');
  const [productType, setProductType] = React.useState('');
  const [categorie, setCategorie] = React.useState('');
  const [items, setItems] = React.useState<Accessory[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editRowId, setEditRowId] = React.useState<string | null>(null);
  const [editCategorie, setEditCategorie] = React.useState('');
  const [editProductType, setEditProductType] = React.useState('');

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (brand) params.set('brand', brand);
    if (year) params.set('year', year);
    if (productType) params.set('productType', productType);
    if (categorie) params.set('categorie', categorie);
    fetch(`/api/accessories?${params.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as ListResponse;
        setItems(data.items);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [search, brand, year, productType, categorie]);

  React.useEffect(() => {
    const abort = load();
    return abort;
  }, [load]);

  const brands = React.useMemo(() => Array.from(new Set(items.map((i) => i.marke).filter(Boolean))) as string[], [items]);
  const years = React.useMemo(() => Array.from(new Set(items.map((i) => i.modelljahr).filter((v): v is number => typeof v === 'number'))).sort((a, b) => b - a), [items]);
  const categories = React.useMemo(() => Array.from(new Set(items.map((i) => i.categorie).filter(Boolean))) as string[], [items]);
  const types = React.useMemo(() => Array.from(new Set(items.map((i) => i.productType).filter(Boolean))) as string[], [items]);

  function startEdit(row: Accessory) {
    setEditRowId(row.id);
    setEditCategorie(row.categorie ?? '');
    setEditProductType(row.productType ?? '');
  }
  function cancelEdit() {
    setEditRowId(null);
    setEditCategorie('');
    setEditProductType('');
  }
  async function saveEdit() {
    if (!editRowId) return;
    const res = await fetch('/api/admin/accessories/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editRowId,
        updates: { categorie: editCategorie, productType: editProductType },
      }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      alert(`Save failed: ${res.status} ${msg}`);
      return;
    }
    cancelEdit();
    load();
  }

  return (
    <main className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">MonkeyLink příslušenství</h1>
        <p className="text-sm text-gray-600 mb-4">Přehled importovaných položek. Filtrujte a jemně dolaďte kategorie a typy. Aktualizace fungují pouze v lokálním vývoji.</p>

        <div className="flex flex-wrap gap-2 items-end mb-4 text-sm">
          <div className="flex flex-col">
            <label className="text-gray-600">Hledat</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="NRLF, EAN, název..." />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600">Značka</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">Vše</option>
              {brands.map((b) => <option key={b} value={b!}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600">Rok</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">Vše</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600">Kategorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">Vše</option>
              {categories.map((c) => <option key={c} value={c!}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600">Typ</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">Vše</option>
              {types.map((t) => <option key={t} value={t!}>{t}</option>)}
            </select>
          </div>
          <button onClick={load} className="ml-auto bg-black text-white px-3 py-2 rounded text-sm">Obnovit</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Obrázek</th>
                <th className="py-2 pr-3">NRLF</th>
                <th className="py-2 pr-3">EAN</th>
                <th className="py-2 pr-3">Produkt</th>
                <th className="py-2 pr-3">Značka</th>
                <th className="py-2 pr-3">Model</th>
                <th className="py-2 pr-3">Barva</th>
                <th className="py-2 pr-3">Rok</th>
                <th className="py-2 pr-3">EK_PL</th>
                <th className="py-2 pr-3">UVP_PL</th>
                <th className="py-2 pr-3">Kategorie</th>
                <th className="py-2 pr-3">Typ</th>
                <th className="py-2 pr-3 w-24">Akce</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={13} className="py-4 text-center text-gray-500">Načítání…</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={13} className="py-4 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && items.map((row) => {
                const isEditing = editRowId === row.id;
                return (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      {row.image ? <img src={row.image} alt={row.produkt ?? ''} className="w-12 h-12 object-contain" /> : null}
                    </td>
                    <td className="py-2 pr-3">{row.nrLf}</td>
                    <td className="py-2 pr-3">{row.ean}</td>
                    <td className="py-2 pr-3">{row.produkt}</td>
                    <td className="py-2 pr-3">{row.marke}</td>
                    <td className="py-2 pr-3">{row.modell}</td>
                    <td className="py-2 pr-3">{row.farbe}</td>
                    <td className="py-2 pr-3">{row.modelljahr ?? ''}</td>
                    <td className="py-2 pr-3">{formatPrice(row.ekPl)}</td>
                    <td className="py-2 pr-3">{formatPrice(row.uvpPl)}</td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <input value={editCategorie} onChange={(e) => setEditCategorie(e.target.value)} className="border rounded px-1 py-0.5 w-40" />
                      ) : (row.categorie ?? '')}
                    </td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <input value={editProductType} onChange={(e) => setEditProductType(e.target.value)} className="border rounded px-1 py-0.5 w-48" />
                      ) : (row.productType ?? '')}
                    </td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="bg-black text-white px-2 py-1 rounded">Uložit</button>
                          <button onClick={cancelEdit} className="border px-2 py-1 rounded">Zrušit</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(row)} className="border px-2 py-1 rounded">Upravit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-sm text-gray-600">Počet položek: {items.length}</div>
      </div>
    </main>
  );
}


