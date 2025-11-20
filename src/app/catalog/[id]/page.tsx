'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const sanitize = (v?: string) => {
  const s = (v ?? '').toString().trim();
  const lower = s.toLowerCase();
  if (lower === 'unknown manual entry required') return '';
  if (lower === 'unknown') return '';
  if (lower === 'manual entry required') return '';
  return s;
};

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  type Bike = {
    id?: string;
    nrLf?: string;
    nrLfBase?: string;
    marke?: string;
    modell?: string;
    bild1?: string;
    farbe?: string;
    motor?: string;
    akku?: string;
    sizes?: string[];
    capacitiesWh?: number[];
    stockSizes?: string[];
    onTheWaySizes?: string[];
    stockQtyBySize?: Record<string, number>;
    mocCzk?: number;
    priceLevelsCzk?: Partial<Record<'A'|'B'|'C'|'D'|'E'|'F', number>>;
    [key: string]: unknown;
  };
  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/catalog/${id}`);
      const data = await res.json();
      setBike(data);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', onKey);
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [isModalOpen]);

  if (loading) return <div className="p-6">Načítám...</div>;
  if (!bike) return <div className="p-6">Nenalezeno</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div
          className={`relative aspect-square bg-white rounded shadow-sm ${typeof bike.bild1 === 'string' && bike.bild1.length > 0 ? 'cursor-zoom-in' : ''}`}
          onClick={() => {
            if (typeof bike.bild1 === 'string' && bike.bild1.length > 0) setIsModalOpen(true);
          }}
          role={typeof bike.bild1 === 'string' && bike.bild1.length > 0 ? 'button' : undefined}
          tabIndex={typeof bike.bild1 === 'string' && bike.bild1.length > 0 ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (typeof bike.bild1 === 'string' && bike.bild1.length > 0) setIsModalOpen(true);
            }
          }}
        >
          {typeof bike.bild1 === 'string' && bike.bild1.length > 0 ? (
            <Image
              src={bike.bild1}
              alt={`${sanitize(bike.marke)} ${sanitize(bike.modell)}`}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain p-6"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Zatím není k dispozici foto
            </div>
          )}
        </div>
        <div>
          <div className="text-sm text-gray-500 font-mono mb-2">{bike.nrLf}</div>
          <h1 className="text-3xl font-bold mb-2">{[sanitize(bike.marke), sanitize(bike.modell)].filter(Boolean).join(' ')}</h1>
          {(() => {
            const hasMoc = typeof bike.mocCzk === 'number' && Number.isFinite(bike.mocCzk) && bike.mocCzk > 0;
            if (!hasMoc) return null;
            return (
              <div className="mb-4">
                <div className="text-4xl font-extrabold text-green-700">
                  {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(bike.mocCzk as number)}
                </div>
              </div>
            );
          })()}
          {bike.farbe && <div className="text-gray-700 mb-4">{bike.farbe}</div>}
          {(bike.motor || bike.akku) && <div className="text-sm text-gray-700 mb-4">{bike.motor}{bike.motor && bike.akku ? ', ' : ''}{bike.akku}</div>}
          
          {(() => {
            const spec = (bike.specifications as Record<string, unknown> | undefined) ?? {};
            const toStr = (v: unknown) => (v == null ? '' : String(v));
            const category = (toStr((bike as Record<string, unknown>)['Categorie (PRGR)']) || toStr((bike as Record<string, unknown>).categoriePrgr) || toStr(spec['Categorie (PRGR)']) || toStr(spec['Category (PRGR)'])).toLowerCase();
            const drive = toStr(spec['Antriebsart (MOTO)']).toLowerCase();
            const isE = category.startsWith('e-') || drive.includes('elektro') || drive.includes('e-') || Boolean(bike.motor);
            if (!isE || !(bike.capacitiesWh && bike.capacitiesWh.length)) return null;
            return <div className="text-sm text-gray-700 mb-2">Baterie: {bike.capacitiesWh.join(', ')} Wh</div>;
          })()}
          {(() => {
            const cat = (bike['Categorie (PRGR)'] ?? bike.categoriePrgr ?? '').toString();
            return cat.toLowerCase() === 'unknown manual entry required' ? null : (
              <div className="text-sm text-gray-500">{cat}</div>
            );
          })()}
          {!!bike.sizes?.length && (
            <div className="text-sm text-gray-700 mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-gray-600">Dostupné velikosti:</span>
              {bike.sizes.map((s) => {
                const inStock = (bike.stockSizes ?? []).includes(s);
                const onWay = !inStock && (bike.onTheWaySizes ?? []).includes(s);
                const qty = Number((bike.stockQtyBySize ?? {})[s] ?? 0);
                const base = (bike.nrLfBase && String(bike.nrLfBase)) || String((bike.nrLf ?? '')).replace(/(\d{2})$/, '');
                const fullNr = `${base}${s}`;
                return (
                  <span
                    key={s}
                    title={fullNr}
                    className={`px-2 py-0.5 rounded-full ring-1 ${inStock ? 'ring-green-600 bg-green-50 text-green-800' : onWay ? 'ring-orange-500 bg-orange-50 text-orange-700' : 'ring-gray-300 bg-white text-gray-800'}`}
                  >
                    {s}{qty > 0 ? ` (${qty})` : ''}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 pb-12">
        {(() => {
          const spec = (bike.specifications as Record<string, unknown> | undefined) ?? {};

          const toStringValue = (v: unknown): string => {
            if (v == null) return '';
            if (typeof v === 'string') return sanitize(v);
            if (typeof v === 'number') return v.toString();
            if (Array.isArray(v)) return v.map(toStringValue).filter(Boolean).join(', ');
            return '';
          };

          const getValue = (keys: string[]): string => {
            for (const k of keys) {
              const top = toStringValue((bike as Record<string, unknown>)[k]);
              if (top) return top;
              const fromSpec = toStringValue(spec[k]);
              if (fromSpec) return fromSpec;
            }
            return '';
          };

          const getCategory = (): string => {
            const c = getValue(['Categorie (PRGR)', 'Category (PRGR)', 'categoriePrgr', 'categoryPrgr']);
            return c.toLowerCase() === 'unknown manual entry required' ? '' : c;
          };

          const isEbike = (): boolean => {
            const cat = getCategory().toLowerCase();
            const drive = getValue(['Antriebsart (MOTO)']).toLowerCase();
            return cat.startsWith('e-') || drive.includes('elektro') || drive.includes('e-') || Boolean(bike.motor);
          };

          type Field = { label: string; keys: string[] };
          type Section = { title: string; fields: Field[]; condition?: () => boolean };

          const sections: Section[] = [
            {
              title: 'Obecné',
              fields: [
                { label: 'Značka', keys: ['marke', 'Marke', 'Hersteller (HERS)'] },
                { label: 'Model', keys: ['modell', 'Modell', 'Model series (MOSE)'] },
                { label: 'Produkt', keys: ['produkt', 'Produkt', 'Product type (PRAR)'] },
                { label: 'Kategorie', keys: ['Categorie (PRGR)', 'Category (PRGR)', 'categoriePrgr', 'categoryPrgr'] },
              ],
            },
            {
              title: 'Rám a odpružení',
              fields: [
                { label: 'Rám', keys: ['Rahmen (RAHM)', 'Frame (RABE)'] },
                { label: 'Vidlice', keys: ['Gabel (GABE)', 'Fork (GABE)'] },
                { label: 'Tlumič', keys: ['Dämpfer (DAMP)', 'Rear suspension (HEF)'] },
                { label: 'Zdvih přední', keys: ['Federweg VR (FWR)', 'Travel fork (FEDE)'] },
                { label: 'Zdvih zadní', keys: ['Federweg HR (FHR)', 'Suspension travel (rear) (HBFW)'] },
              ],
            },
            {
              title: 'Pohon a brzdy',
              fields: [
                { label: 'Řazení', keys: ['Schaltung (SCHL)', 'Derailleur type (SCHF)', 'Derailleur type - gears (GANG)'] },
                { label: 'Kliky', keys: ['Kurbelsatz (KURA)', 'Crankset (TRLA)'] },
                { label: 'Kazeta', keys: ['Kassette (KASS)', 'Cassette (CASE)'] },
                { label: 'Řetěz', keys: ['Kette (KETT)', 'Chain (KETT)'] },
                { label: 'Brzda přední', keys: ['Bremse VR (BRVR)', 'Brake (BRMV)', 'Brakes (BREM)', 'Brake disc (BRSV)'] },
                { label: 'Brzda zadní', keys: ['Bremse HR (BRHR)', 'Brake disc rear (BRSH)'] },
              ],
            },
            {
              title: 'Kola a pláště',
              fields: [
                { label: 'Ráfek', keys: ['Felge (FELG)', 'Rim (FELG)'] },
                { label: 'Plášť přední', keys: ['Reifen VR (RVR)', 'Tires (BERE)'] },
                { label: 'Plášť zadní', keys: ['Reifen HR (RHR)'] },
                { label: 'Velikost kol', keys: ['Laufradgröße (LRGR)', 'Wheel size (RADG)'] },
              ],
            },
            {
              title: 'E‑bike systém',
              condition: isEbike,
              fields: [
                { label: 'Motor', keys: ['Motor (MOTO)', 'Motor (MOTM)', 'motor'] },
                { label: 'Výkon motoru (W)', keys: ['Motorleistung (W) (MOPW)', 'Motorleistung (Watt) (MLWA)'] },
                { label: 'Točivý moment (Nm)', keys: ['Drehmoment (Nm) (MOTQ)', 'Drehmoment (Nm) (DMNM)'] },
                { label: 'Baterie', keys: ['Akku (AKKU)', 'Akkumodell (AKKU)', 'Akku', 'akku'] },
                { label: 'Kapacita baterie (Wh)', keys: ['Akkukapazität (Wh) (AKWH)', 'Battery (Wh) (AKLW)'] },
                { label: 'Displej', keys: ['Display (DISP)'] },
                { label: 'Nabíječka', keys: ['Ladegerät (LADG)', 'Charger (LGSC)'] },
              ],
            },
            {
              title: 'Vybavení a doplňky',
              fields: [
                { label: 'Sedlo', keys: ['Sattel (SATT)', 'Saddle (SATT)'] },
                { label: 'Sedlovka', keys: ['Sattelstütze (STZT)', 'Seatpost (SAST)'] },
                { label: 'Představec', keys: ['Vorbau (VORB)', 'Stem (VORB)'] },
                { label: 'Řídítka', keys: ['Lenker (LENK)', 'Handlebar (LENB)'] },
                { label: 'Světlo přední', keys: ['Licht VR (FRLI)', 'Front lightning set (FRLI)'] },
                { label: 'Světlo zadní', keys: ['Licht HR (RLIC)', 'Rear lightning set (RLIC)'] },
                { label: 'Nosič', keys: ['Gepäckträger (GEPK)', 'Carrier (GPT)'] },
                { label: 'Stojan', keys: ['Ständer (STAN)', 'Stand (STAE)'] },
              ],
            },
            {
              title: 'Hmotnost',
              fields: [
                { label: 'Hmotnost', keys: ['Gewicht (GEWI)', 'Weight ** (GEW)'] },
                { label: 'Hmotnost bez baterie', keys: ['Gewicht ohne Akku (GWAK)'] },
              ],
            },
          ];

          const renderRow = (label: string, value: string) => (
            <div key={label} className="grid grid-cols-3 gap-4 py-2">
              <div className="col-span-1 text-gray-500 text-sm">{label}</div>
              <div className="col-span-2 text-sm text-gray-800">{value}</div>
            </div>
          );

          return (
            <div className="bg-white rounded-lg overflow-hidden shadow-sm divide-y">
              {sections.map((section) => {
                if (section.condition && !section.condition()) return null;
                const rows = section.fields
                  .map((f) => ({ label: f.label, value: getValue(f.keys) }))
                  .filter((r) => Boolean(r.value));
                if (rows.length === 0) return null;
                return (
                  <div key={section.title} className="p-4">
                    <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
                    <div className="divide-y">
                      {rows.map((r) => renderRow(r.label, r.value))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>
      {isModalOpen && typeof bike.bild1 === 'string' && bike.bild1.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="absolute top-4 right-4">
            <button
              aria-label="Zavřít"
              className="h-10 w-10 rounded-full bg-white/90 text-gray-800 hover:bg-white flex items-center justify-center shadow"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="relative w-[90vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={bike.bild1} alt={`${sanitize(bike.marke)} ${sanitize(bike.modell)}`} fill className="object-contain" />
          </div>
        </div>
      )}
    </main>
  );
}


