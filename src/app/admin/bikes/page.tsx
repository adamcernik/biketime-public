'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';

type Bike = {
  id: string;
  marke?: string;
  modell?: string;
  nrLf?: string;
  bild1?: string;
  isActive?: boolean;
  modelljahr?: number; // optional normalized year if present
  specifications?: Record<string, unknown>; // for extracting year
};

export default function AdminBikesPage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<string>('');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!db) return;
      setLoading(true);
      const col = collection(db, 'bikes');
      // If a year is selected, query by top-level field to avoid slicing issues
      const q = year ? query(col, where('modelljahr', '==', parseInt(year, 10))) : query(col, limit(400));
      const snap = await getDocs(q);
      const items: Bike[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Bike>) }));
      // derive model years from known fields
      const extractYear = (b: Bike): number | null => {
        const top = (b as unknown as { modelljahr?: unknown; modelYear?: unknown });
        const fromTop = top.modelljahr ?? top.modelYear;
        const specs = b.specifications as Record<string, unknown> | undefined;
        const fromSpec = (specs?.Modelljahr as unknown) ?? (specs?.modelljahr as unknown);
        const v = fromTop ?? fromSpec;
        const n = parseInt((v ?? '').toString(), 10);
        return Number.isFinite(n) ? n : null;
      };
      if (!year) {
        const years = Array.from(new Set(items.map(extractYear).filter((n): n is number => n != null))).sort((a,b)=>b-a).map(String);
        if (years.length) setYearOptions(years);
      }
      setBikes(items);
      setLoading(false);
    };
    void load();
  }, [year]);

  // Fetch authoritative year options from API (aggregated over entire collection)
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/catalog?year=2026&refresh=true&pageSize=1', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const apiYears = ((data?.yearOptions ?? []) as number[]).map(String);
        if (apiYears.length) setYearOptions(apiYears);
      } catch {
        // ignore
      }
    };
    void fetchYears();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const matchSearch = (b: Bike) =>
      (b.marke ?? '').toLowerCase().includes(s) ||
      (b.modell ?? '').toLowerCase().includes(s) ||
      (b.nrLf ?? '').toLowerCase().includes(s)
    ;
    const extractYear = (b: Bike): number | null => {
      const top = (b as unknown as { modelljahr?: unknown; modelYear?: unknown });
      const fromTop = top.modelljahr ?? top.modelYear;
      const specs = b.specifications as Record<string, unknown> | undefined;
      const fromSpec = (specs?.Modelljahr as unknown) ?? (specs?.modelljahr as unknown);
      const v = fromTop ?? fromSpec;
      const n = parseInt((v ?? '').toString(), 10);
      return Number.isFinite(n) ? n : null;
    };
    return bikes.filter((b) => {
      const okSearch = !s || matchSearch(b);
      const okYear = !year || String(extractYear(b) ?? '') === year;
      return okSearch && okYear;
    });
  }, [bikes, search, year]);

  const toggleActive = async (id: string, value: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'bikes', id), { isActive: value });
    setBikes((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: value } : b)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kola</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat podle značky, modelu nebo NRLF…"
          className="rounded px-3 h-10 text-sm w-full md:w-96 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <div className="relative">
          <select
            value={year}
            onChange={(e)=>setYear(e.target.value)}
            className="appearance-none bg-white rounded px-3 pr-8 h-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Všechny roky</option>
            {yearOptions.map((y)=> (
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
      {loading ? (
        <div className="text-gray-600">Načítám…</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="p-3">NRLF</th>
                <th className="p-3">Značka</th>
                <th className="p-3">Model</th>
                <th className="p-3">Zobrazit</th>
                <th className="p-3">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-gray-600 whitespace-nowrap">{b.nrLf}</td>
                  <td className="p-3 whitespace-nowrap">{b.marke}</td>
                  <td className="p-3">{b.modell}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(b.isActive)}
                        onChange={(e) => toggleActive(b.id, e.target.checked)}
                      />
                      <span>{b.isActive ? 'ANO' : 'NE'}</span>
                    </label>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <Link href={`/admin/bikes/${b.id}`} className="text-blue-600 hover:underline">Upravit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


