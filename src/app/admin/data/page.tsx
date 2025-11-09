'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';

type BikeDoc = {
  id: string;
  marke?: string;
  modell?: string;
  nrLf?: string;
  lfSn?: string;
  akku?: string;
  modelljahr?: unknown;
  specifications?: Record<string, unknown>;
  [key: string]: unknown;
};

type TierLevels = Partial<Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', number>>;

const toNumberFromMixed = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const PRICE_KEYS = ['moc','MOC','mocCzk','mocCZK','priceCzk','priceCZK','price','cena','Cena','uvp','UVP','UPE','uvpCZK'];
const getMocCzk = (b: BikeDoc): number | null => {
  for (const k of PRICE_KEYS) {
    const n = toNumberFromMixed((b as Record<string, unknown>)[k]);
    if (n != null) return n;
  }
  const spec = (b.specifications ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(spec)) {
    if (/moc|uvp|price|cena/i.test(k)) {
      const n = toNumberFromMixed(spec[k]);
      if (n != null) return n;
    }
  }
  return null;
};

const getTierPricesCzk = (b: BikeDoc): TierLevels => {
  const out: TierLevels = {};
  const tryAssign = (key: string, value: unknown) => {
    const keyNorm = String(key).replace(/[\s.\-]/g, '').toLowerCase();
    const keyNoCzk = keyNorm.replace(/czk$/, '');
    const direct = keyNoCzk.length === 1 ? keyNoCzk.toUpperCase() : '';
    const stripped = keyNoCzk.replace(/^(price|cena|cenik|tier|level|pricelist|dealer)/, '');
    const suffix = stripped.length === 1 ? stripped.toUpperCase() : '';
    const firstChar = keyNoCzk.charAt(0).toUpperCase();
    const restHasPrice = /price|cena|cenik/.test(keyNoCzk.slice(1));
    const candidate = ['A','B','C','D','E','F'].includes(direct)
      ? direct
      : (['A','B','C','D','E','F'].includes(suffix) ? suffix : (restHasPrice && ['A','B','C','D','E','F'].includes(firstChar) ? firstChar : ''));
    if (!candidate) return;
    const n = toNumberFromMixed(value);
    if (n != null) out[candidate as 'A'|'B'|'C'|'D'|'E'|'F'] = n;
  };
  for (const [k, v] of Object.entries(b)) tryAssign(k, v);
  const spec = (b.specifications ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(spec)) tryAssign(k, v);
  return out;
};

const capacityCodeToWh: Record<string, number> = { '9': 900, '8': 800, '7': 750, '6': 600, '5': 500, '4': 400 };
const parseCapacityFromText = (text?: unknown): number | null => {
  const s = (text ?? '').toString();
  const m = s.match(/(\d{3,4})\s*wh/i);
  return m ? parseInt(m[1], 10) : null;
};
const isEbike = (b: BikeDoc): boolean => {
  const cat = ((b as Record<string, unknown>)['Category (PRGR)'] ?? (b as Record<string, unknown>)['Categorie (PRGR)'] ?? b.specifications?.['Category (PRGR)'] ?? b.specifications?.['Categorie (PRGR)'] ?? '').toString().toLowerCase();
  const drive = (b.specifications?.['Antriebsart (MOTO)'] ?? '').toString().toLowerCase();
  return cat.startsWith('e-') || drive.includes('elektro');
};
const getCapacityWh = (b: BikeDoc): number | null => {
  const fromFields =
    parseCapacityFromText(b.akku) ||
    parseCapacityFromText(b.specifications?.Akku) ||
    parseCapacityFromText(b.specifications?.['Akkumodell (AKKU)']) ||
    parseCapacityFromText(b.specifications?.['Akku (AKKU)']);
  if (fromFields) return fromFields;
  if (!isEbike(b)) return null;
  const nr = ((b.nrLf ?? b.lfSn ?? '') as string).toString();
  if (nr.length >= 3) {
    const code = nr.charAt(nr.length - 3);
    if (capacityCodeToWh[code]) return capacityCodeToWh[code];
  }
  return null;
};

const getYear = (b: BikeDoc): number | null => {
  const y = b.modelljahr ?? b.specifications?.Modelljahr ?? b.specifications?.modelljahr;
  const n = parseInt((y ?? '').toString(), 10);
  return Number.isFinite(n) ? n : null;
};

export default function AdminDataGridPage() {
  const [items, setItems] = useState<BikeDoc[]>([]);
  const [year, setYear] = useState<string>('');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!db) return;
      setLoading(true);
      const col = collection(db, 'bikes');
      const q = year ? query(col, where('modelljahr', '==', parseInt(year, 10))) : query(col, limit(500));
      const snap = await getDocs(q);
      const docs: BikeDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      if (!year) {
        const years = Array.from(new Set(docs.map(getYear).filter((n): n is number => n != null))).sort((a,b)=>b-a).map(String);
        if (years.length) setYearOptions(years);
      }
      setItems(docs);
      setLoading(false);
    };
    void load();
  }, [year]);

  const rows = useMemo(() => {
    return items.map((b) => {
      const nr = ((b.nrLf ?? b.lfSn ?? '') as string).toString();
      const size = nr.match(/(\d{2})$/)?.[1] ?? '';
      const battery = getCapacityWh(b);
      const yr = getYear(b);
      const moc = getMocCzk(b);
      const tiers = getTierPricesCzk(b);
      return { id: b.id, nr, model: `${b.marke ?? ''} ${b.modell ?? ''}`.trim(), size, battery, year: yr, moc, tiers };
    });
  }, [items]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Data grid</h1>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <select
            value={year}
            onChange={(e)=>setYear(e.target.value)}
            className="appearance-none bg-white rounded px-2 pr-7 h-8 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Všechny roky</option>
            {yearOptions.map((y)=> (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
            </svg>
          </span>
        </div>
        {loading && <span className="text-xs text-gray-500">Načítám…</span>}
      </div>
      <div className="overflow-x-auto bg-white rounded shadow-sm">
        <table className="min-w-full text-[11px]">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="p-2">NRLF</th>
              <th className="p-2">Model</th>
              <th className="p-2">Vel.</th>
              <th className="p-2">Baterie (Wh)</th>
              <th className="p-2">Rok</th>
              <th className="p-2">MOC</th>
              <th className="p-2">A</th>
              <th className="p-2">B</th>
              <th className="p-2">C</th>
              <th className="p-2">D</th>
              <th className="p-2">E</th>
              <th className="p-2">F</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r)=> (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2 font-mono text-gray-700 whitespace-nowrap">{r.nr}</td>
                <td className="p-2 whitespace-nowrap">{r.model || '—'}</td>
                <td className="p-2 whitespace-nowrap">{r.size || '—'}</td>
                <td className="p-2 whitespace-nowrap">{r.battery ?? '—'}</td>
                <td className="p-2 whitespace-nowrap">{r.year ?? '—'}</td>
                <td className="p-2 whitespace-nowrap">
                  {typeof r.moc === 'number' ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(r.moc) : '—'}
                </td>
                {(['A','B','C','D','E','F'] as const).map((k)=> (
                  <td key={k} className="p-2 whitespace-nowrap">
                    {typeof r.tiers[k] === 'number' ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(r.tiers[k] as number) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


