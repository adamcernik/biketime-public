'use client';

import { useParams } from 'next/navigation';
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
    batteryVariants?: { capacityWh: number; id: string }[];
    stockSizes?: string[];
    onTheWaySizes?: string[];
    stockQtyBySize?: Record<string, number>;
    sizeToNrLf?: Record<string, string>;
    mocCzk?: number;
    priceLevelsCzk?: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E' | 'F', number>>;
    [key: string]: unknown;
  };
  const [bike, setBike] = useState<Bike | null>(null);
  const [activeBike, setActiveBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/catalog/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setBike(data);
        setActiveBike(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
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

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!activeBike) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Kolo nenalezeno</h1>
        <Link href="/catalog" className="text-primary hover:underline">Zpět do katalogu</Link>
      </div>
    </div>
  );

  const brand = sanitize(activeBike.marke);
  const model = sanitize(activeBike.modell);
  const fullName = [brand, model].filter(Boolean).join(' ');

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-zinc-200">
        <div className="container-custom py-3">
          <nav className="flex text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Domů</Link>
            <span className="mx-2">/</span>
            <Link href="/catalog" className="hover:text-zinc-900 transition-colors">Katalog</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-900 font-medium truncate">{fullName}</span>
          </nav>
        </div>
      </div>

      <section className="container-custom py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Image Section */}
          <div className="space-y-4">
            <div
              className={`relative aspect-[4/3] bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm ${typeof activeBike.bild1 === 'string' && activeBike.bild1.length > 0 ? 'cursor-zoom-in group' : ''}`}
              onClick={() => {
                if (typeof activeBike.bild1 === 'string' && activeBike.bild1.length > 0) setIsModalOpen(true);
              }}
            >
              {typeof activeBike.bild1 === 'string' && activeBike.bild1.length > 0 ? (
                <>
                  <Image
                    src={activeBike.bild1}
                    alt={fullName}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    priority
                    unoptimized
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-2 shadow-sm text-zinc-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                  Foto není k dispozici
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">{brand}</div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-900 mb-4 leading-tight">{model}</h1>

              <div className="flex flex-wrap gap-3 mb-6">
                {activeBike.motor && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {activeBike.motor}
                  </span>
                )}
                {activeBike.akku && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {activeBike.akku}
                  </span>
                )}
              </div>

              {typeof activeBike.mocCzk === 'number' && activeBike.mocCzk > 0 ? (
                <div className="text-4xl font-bold text-zinc-900 mb-2">
                  {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(activeBike.mocCzk)}
                </div>
              ) : (
                <div className="text-2xl font-medium text-zinc-500">Cena na vyžádání</div>
              )}
              <div className="text-sm text-zinc-500">Včetně DPH</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm mb-8">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">Dostupnost</h3>
              {!!activeBike.sizes?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeBike.sizes.map((s) => {
                    const inStock = (activeBike.stockSizes ?? []).includes(s);
                    const onWay = !inStock && (activeBike.onTheWaySizes ?? []).includes(s);
                    const qty = Number((activeBike.stockQtyBySize ?? {})[s] ?? 0);
                    const nrLf = (activeBike.sizeToNrLf ?? {})[s] ?? '';

                    return (
                      <div
                        key={s}
                        className={`flex flex-col justify-between p-3 rounded-lg border ${inStock ? 'border-green-200 bg-green-50/50' :
                          onWay ? 'border-orange-200 bg-orange-50/50' :
                            'border-zinc-100 bg-zinc-50'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-medium text-zinc-900">Velikost {s}</span>
                          {inStock ? (
                            <span className="flex items-center text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              SKLADEM {qty > 0 ? `(${qty} ks)` : ''}
                            </span>
                          ) : onWay ? (
                            <span className="flex items-center text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded">
                              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                              NA CESTĚ
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-zinc-400">Na objednávku</span>
                          )}
                        </div>
                        {nrLf && (
                          <div className="text-[10px] font-light text-zinc-400">
                            {nrLf}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">Informace o velikostech nejsou k dispozici.</div>
              )}
            </div>

            {/* Battery Variants */}
            {!!activeBike.batteryVariants?.length && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm mb-8">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">Kapacita baterie</h3>
                <div className="flex flex-wrap gap-3">
                  {activeBike.batteryVariants.map((v) => {
                    const isActive = activeBike.id === v.id;
                    return (
                      <button
                        key={v.capacityWh}
                        onClick={() => {
                          // Merge variant data into active bike
                          // We need to be careful to preserve fields that might not be in variant if they are shared
                          // But our API returns full details for variant now (except maybe images/specs if they are same)
                          // Actually, API returns a subset. We should merge.
                          const newBike = { ...activeBike, ...v };
                          setActiveBike(newBike as Bike);
                          window.history.replaceState(null, '', `/catalog/${v.id}`);
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${isActive
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                          }`}
                      >
                        {v.capacityWh} Wh
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="prose prose-zinc max-w-none">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Specifikace</h3>
              {(() => {
                const spec = (activeBike.specifications as Record<string, unknown> | undefined) ?? {};

                const toStringValue = (v: unknown): string => {
                  if (v == null) return '';
                  if (typeof v === 'string') return sanitize(v);
                  if (typeof v === 'number') return v.toString();
                  if (Array.isArray(v)) return v.map(toStringValue).filter(Boolean).join(', ');
                  return '';
                };

                const getValue = (keys: string[]): string => {
                  for (const k of keys) {
                    const top = toStringValue((activeBike as Record<string, unknown>)[k]);
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
                  return cat.startsWith('e-') || drive.includes('elektro') || drive.includes('e-') || Boolean(activeBike.motor);
                };

                type Field = { label: string; keys: string[] };
                type Section = { title: string; fields: Field[]; condition?: () => boolean };

                const sections: Section[] = [
                  {
                    title: 'E‑bike systém',
                    condition: isEbike,
                    fields: [
                      { label: 'Motor', keys: ['Motor (MOTO)', 'Motor (MOTM)', 'motor'] },
                      { label: 'Výkon motoru (W)', keys: ['Motorleistung (W) (MOPW)', 'Motorleistung (Watt) (MLWA)'] },
                      { label: 'Točivý moment (Nm)', keys: ['Drehmoment (Nm) (MOTQ)', 'Drehmoment (Nm) (DMNM)'] },
                      { label: 'Baterie', keys: ['Akku (AKKU)', 'Akkumodell (AKKU)', 'Akku', 'akku'] },
                      { label: 'Kapacita baterie (Wh)', keys: ['capacityWh', 'Akkukapazität (Wh) (AKWH)', 'Battery (Wh) (AKLW)'] },
                      { label: 'Displej', keys: ['Display (DISP)'] },
                      { label: 'Nabíječka', keys: ['Ladegerät (LADG)', 'Charger (LGSC)'] },
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

                return (
                  <div className="space-y-6">
                    {sections.map((section) => {
                      if (section.condition && !section.condition()) return null;
                      const rows = section.fields
                        .map((f) => ({ label: f.label, value: getValue(f.keys) }))
                        .filter((r) => Boolean(r.value));
                      if (rows.length === 0) return null;

                      return (
                        <div key={section.title} className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                          <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-100 font-semibold text-zinc-900 text-sm">
                            {section.title}
                          </div>
                          <div className="divide-y divide-zinc-50">
                            {rows.map((r) => (
                              <div key={r.label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                                <div className="col-span-1 text-zinc-500">{r.label}</div>
                                <div className="col-span-2 text-zinc-900 font-medium">{r.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
      {isModalOpen && typeof activeBike.bild1 === 'string' && activeBike.bild1.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="absolute top-4 right-4 z-10">
            <button
              aria-label="Zavřít"
              className="h-12 w-12 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative w-[95vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={activeBike.bild1}
              alt={fullName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized
            />
          </div>
        </div>
      )}
    </main>
  );
}
