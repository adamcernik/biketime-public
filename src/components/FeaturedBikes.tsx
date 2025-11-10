'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type BikeCard = {
  id: string;
  marke?: string;
  modell?: string;
  bild1?: string;
  mocCzk?: number | null;
  motor?: string;
  akku?: string;
};

const sanitize = (v?: string) => (v ?? '').toString().trim();

export default function FeaturedBikes() {
  const [bikes, setBikes] = useState<BikeCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Try homepage config first
        const conf = await fetch('/api/homepage', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ featured: [] }));
        const featured: BikeCard[] = (conf?.featured ?? []) as BikeCard[];
        if (featured.length > 0) {
          setBikes(featured.slice(0, 3));
        } else {
          // Fallback to auto pick
          const res = await fetch('/api/catalog?ebike=true&year=2026&pageSize=3');
          const data = await res.json();
          setBikes((data?.bikes ?? []).slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Vybrané modely</h2>
      {loading ? (
        <div className="text-gray-600">Načítám...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {bikes.map((b) => (
            <div key={b.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/catalog/${b.id}`}>
                <div className="aspect-square relative bg-white flex items-center justify-center">
                  {b.bild1 ? (
                    <Image src={b.bild1} alt={`${sanitize(b.marke)} ${sanitize(b.modell)}`} fill className="object-contain p-4" />
                  ) : (
                    <div className="text-gray-500 text-sm">Zatím není k dispozici foto</div>
                  )}
                </div>
              </Link>
              <div className="p-4 space-y-1">
                <div className="font-semibold leading-tight">{[sanitize(b.marke), sanitize(b.modell)].filter(Boolean).join(' ')}</div>
                {(b.motor || b.akku) && (
                  <div className="text-xs text-gray-600">
                    {b.motor}{b.motor && b.akku ? ' · ' : ''}{b.akku}
                  </div>
                )}
                {typeof b.mocCzk === 'number' && b.mocCzk > 0 && (
                  <div className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(b.mocCzk)}
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href={`/catalog/${b.id}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 text-sm"
                  >
                    Zjistit více
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


