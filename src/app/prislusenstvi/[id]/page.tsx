'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Accessory = {
  id: string;
  nrLf?: string;
  ean?: string;
  produkt?: string;
  produktCs?: string;
  marke?: string;
  modell?: string;
  farbe?: string;
  modelljahr?: number | null;
  image?: string;
  imageTransparent?: string;
  imageDetail1?: string;
  imageDetail2?: string;
  imageDetail3?: string;
  categorie?: string;
  productType?: string;
  ekPl?: number | null;
  uvpPl?: number | null;
  uavpPl?: number | null;
  spezifikation?: string;
  hersteller?: string;
  b2bOrderStatus?: string;
  specs?: Record<string, unknown>;
};

function translateType(type?: string): string {
  if (!type) return '';
  const map: Record<string, string> = {
    'Electronic accessories': 'Elektronické příslušenství',
    'Electronics accessories': 'Elektronické příslušenství',
    'E-Bike headlights': 'Přední světla pro e‑bike',
    'E-Bike rear light': 'Zadní světla pro e‑bike',
    'Rechargeable/battery-powered headlights': 'Dobíjecí/poháněná baterií světla',
    'E-bike lighting set': 'Sada osvětlení pro e‑bike',
    'Headlights': 'Přední světla',
    'Rear light': 'Zadní světlo',
    'Lighting accessories': 'Příslušenství k osvětlení',
    'Mudguards': 'Blatníky',
    'Mudguard set': 'Sada blatníků',
    'Front mudguard': 'Přední blatník',
    'Accessories mudguards': 'Příslušenství k blatníkům',
    'Bottles & holders': 'Láhve a košíky',
    'Water bottle holder': 'Košík na láhev',
    'Drinking bottle': 'Cyklistická láhev',
    'Bicycle locks': 'Cyklistické zámky',
    'Lock accessories': 'Příslušenství k zámkům',
    'Folding shackle lock': 'Skládací zámek',
    'Charger': 'Nabíječka',
    'Cables': 'Kabely',
    'ML-InterfaceRecharge': 'ML-Interface Recharge',
    'Stem': 'Představec',
    'Stems': 'Představce',
    'Stem accessories': 'Příslušenství k představcům',
    'Seat clamp': 'Objímka sedlovky',
    'Seat posts': 'Sedlovky',
    'Seat post accessories': 'Příslušenství k sedlovkám',
    'Holder': 'Držák',
    'Smartphone accessories': 'Příslušenství pro smartphone',
    'Smartphone-Halter': 'Držák na smartphone',
    'Ladekabel': 'Nabíjecí kabel',
  };
  return map[type] ?? type;
}

const SPEC_KEY_LABELS: Record<string, string> = {
  gewicht: 'Hmotnost',
  weight: 'Hmotnost',
  material: 'Materiál',
  farbe: 'Barva',
  color: 'Barva',
  groesse: 'Velikost',
  size: 'Velikost',
  durchmesser: 'Průměr',
  diameter: 'Průměr',
  laenge: 'Délka',
  length: 'Délka',
  breite: 'Šířka',
  width: 'Šířka',
  hoehe: 'Výška',
  height: 'Výška',
  spannung: 'Napětí',
  voltage: 'Napětí',
  leistung: 'Výkon',
  power: 'Výkon',
  lumen: 'Svítivost (lumen)',
  akku: 'Baterie',
  battery: 'Baterie',
  ladezeit: 'Doba nabíjení',
  leuchtdauer: 'Doba svícení',
  anschluss: 'Připojení',
  kompatibilitaet: 'Kompatibilita',
  compatibility: 'Kompatibilita',
};

function translateSpecKey(key: string): string {
  return SPEC_KEY_LABELS[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
}

function formatSpecValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Ano' : 'Ne';
  if (typeof val === 'number') return String(val);
  return String(val);
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'skladem': return 'Skladem';
    case 'na_ceste': return 'Na cestě';
    case 'na_objednavku': return 'Na objednávku';
    default: return '';
  }
}

function getStatusClasses(status?: string): string {
  switch (status) {
    case 'skladem': return 'bg-green-100 text-green-700';
    case 'na_ceste': return 'bg-blue-100 text-blue-700';
    case 'na_objednavku': return 'bg-orange-100 text-orange-700';
    default: return 'bg-zinc-100 text-zinc-500';
  }
}

export default function AccessoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = React.useState<Accessory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/accessories/${id}`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Accessory;
      })
      .then((acc) => {
        setData(acc);
        setSelectedImage(acc.image || null);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [id]);

  const title = React.useMemo(() => {
    if (!data) return '';
    const parts = [data.marke, data.produktCs || data.produkt || data.modell].filter(Boolean);
    return parts.join(' ');
  }, [data]);

  const allImages = React.useMemo(() => {
    if (!data) return [];
    return [data.image, data.imageDetail1, data.imageDetail2, data.imageDetail3].filter(Boolean) as string[];
  }, [data]);

  const specsEntries = React.useMemo(() => {
    if (!data?.specs) return [];
    return Object.entries(data.specs).filter(([, val]) => val !== null && val !== undefined && val !== '');
  }, [data]);

  const statusLabel = data ? getStatusLabel(data.b2bOrderStatus) : '';

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="container-custom py-4 flex items-center gap-2 text-sm">
          <Link href="/prislusenstvi" className="text-zinc-500 hover:text-zinc-900 transition-colors">
            Příslušenství
          </Link>
          <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-zinc-900 font-medium truncate">{title || 'Detail'}</span>
        </div>
      </header>

      <section className="container-custom py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl aspect-square animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-24" />
              <div className="h-8 bg-zinc-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 bg-red-50 rounded-xl">Chyba: {error}</div>
        ) : !data ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-lg">Produkt nebyl nalezen.</p>
            <Link href="/prislusenstvi" className="mt-4 inline-block text-primary font-medium hover:underline">
              Zpět na příslušenství
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image gallery */}
            <div>
              <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
                <div className="aspect-square relative">
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-contain p-6 mix-blend-multiply"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400">Bez foto</div>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`aspect-square relative bg-white rounded-xl border overflow-hidden transition-all ${
                        selectedImage === img
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${title} - foto ${i + 1}`}
                        fill
                        sizes="120px"
                        className="object-contain p-2 mix-blend-multiply"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 font-mono tracking-wide">{data.nrLf || data.ean}</div>

              <div>
                <span className="text-xs font-bold text-primary tracking-wider uppercase">{data.marke}</span>
                <h1 className="text-2xl font-bold text-zinc-900 mt-1">
                  {data.produktCs || data.produkt || data.modell || ''}
                </h1>
              </div>

              {/* Status badge */}
              {statusLabel && (
                <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${getStatusClasses(data.b2bOrderStatus)}`}>
                  {statusLabel}
                </span>
              )}

              {/* Category / Type / Color */}
              <div className="text-sm text-zinc-600">
                {[translateType(data.productType), data.categorie, data.farbe].filter(Boolean).join(' · ')}
              </div>

              {!!data.modelljahr && (
                <div className="text-sm text-zinc-500">Modelový rok: {data.modelljahr}</div>
              )}

              {data.hersteller && (
                <div className="text-sm text-zinc-500">Výrobce: {data.hersteller}</div>
              )}

              {/* Specification text */}
              {data.spezifikation && (
                <div className="pt-2 border-t border-zinc-100">
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{data.spezifikation}</p>
                </div>
              )}

              {/* Structured specs */}
              {specsEntries.length > 0 && (
                <div className="pt-4 border-t border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900 mb-3">Specifikace</h3>
                  <dl className="space-y-2">
                    {specsEntries.map(([key, val]) => (
                      <div key={key} className="flex items-baseline gap-2 text-sm">
                        <dt className="text-zinc-500 min-w-[120px] shrink-0">{translateSpecKey(key)}</dt>
                        <dd className="text-zinc-900">{formatSpecValue(val)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Back link */}
              <div className="pt-6">
                <Link
                  href="/prislusenstvi"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Zpět na příslušenství
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
