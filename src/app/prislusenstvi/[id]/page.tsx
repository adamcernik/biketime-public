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

export default function AccessoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = React.useState<Accessory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      .then((acc) => setData(acc))
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [id]);

  const title = React.useMemo(() => {
    if (!data) return '';
    const parts = [data.marke, data.produkt || data.modell].filter(Boolean);
    return parts.join(' ');
  }, [data]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="text-sm">
            <Link href="/prislusenstvi" className="text-gray-600 hover:text-black">Příslušenství</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800">{title || 'Detail'}</span>
          </div>
        </div>
      </header>
      <section className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-gray-600">Načítám…</div>
        ) : error ? (
          <div className="text-red-600">Chyba: {error}</div>
        ) : !data ? (
          <div className="text-gray-600">Produkt nebyl nalezen.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-square relative">
                {data.image ? (
                  <Image
                    src={data.image}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">Bez foto</div>
                )}
              </div>
            </div>
            <div className="p-1 md:p-0">
              <div className="text-xs text-gray-500 font-mono">{data.nrLf || data.ean}</div>
              <h1 className="text-xl font-semibold mt-1">{title}</h1>
              <div className="text-sm text-gray-600 mt-1">
                {[translateType(data.productType), data.categorie, data.farbe].filter(Boolean).join(' · ')}
              </div>
              {!!data.modelljahr && (
                <div className="text-sm text-gray-600 mt-1">Rok: {data.modelljahr}</div>
              )}
              {data.hersteller && (
                <div className="text-sm text-gray-600 mt-1">Výrobce: {data.hersteller}</div>
              )}
              {data.spezifikation && (
                <div className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{data.spezifikation}</div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


