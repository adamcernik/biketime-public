'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SimpleBikeCard from './SimpleBikeCard';

type BikeCard = {
  id: string;
  marke?: string;
  modell?: string;
  bild1?: string;
  mocCzk?: number | null;
  motor?: string;
  akku?: string;
};

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
              <SimpleBikeCard key={b.id} bike={b} />
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


