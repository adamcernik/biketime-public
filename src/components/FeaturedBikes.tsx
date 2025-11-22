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
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900">Vybrané modely</h2>
            <p className="text-zinc-500">To nejlepší z aktuální kolekce Bulls</p>
          </div>
          <Link href="/catalog" className="hidden md:inline-flex items-center text-primary font-medium hover:text-red-700 transition-colors group">
            Zobrazit vše
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bikes.map((b) => (
              <Link key={b.id} href={`/catalog/${b.id}`} className="group block">
                <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-[4/3] relative bg-zinc-50 p-6 group-hover:bg-zinc-100 transition-colors">
                    {b.bild1 ? (
                      <Image
                        src={b.bild1}
                        alt={`${sanitize(b.marke)} ${sanitize(b.modell)}`}
                        fill
                        className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                        Foto není k dispozici
                      </div>
                    )}
                    {/* Badges could go here */}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                      {sanitize(b.marke)}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                      {sanitize(b.modell)}
                    </h3>

                    {(b.motor || b.akku) && (
                      <div className="flex flex-wrap gap-2 mb-4 text-xs text-zinc-500">
                        {b.motor && <span className="bg-zinc-100 px-2 py-1 rounded">{b.motor}</span>}
                        {b.akku && <span className="bg-zinc-100 px-2 py-1 rounded">{b.akku}</span>}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div className="text-lg font-bold text-zinc-900">
                        {typeof b.mocCzk === 'number' && b.mocCzk > 0 ? (
                          new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(b.mocCzk)
                        ) : (
                          <span className="text-zinc-400 text-sm font-normal">Cena na vyžádání</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 flex items-center">
                        Detail
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/catalog" className="inline-flex items-center justify-center px-6 py-3 border border-zinc-200 rounded-full text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors w-full">
            Zobrazit celý katalog
          </Link>
        </div>
      </div>
    </section>
  );
}


