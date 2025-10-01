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
  const [bike, setBike] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-6">Načítám...</div>;
  if (!bike) return <div className="p-6">Nenalezeno</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/catalog" className="text-blue-600">← Zpět</Link>
          <Link href="/" className="flex items-center">
            <img src="/biketime-logo.png" alt="BikeTime" className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-white border rounded">
          {bike.bild1 ? (
            <Image src={bike.bild1} alt={`${sanitize(bike.marke)} ${sanitize(bike.modell)}`} fill className="object-contain p-6" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Zatím není k dispozici foto
            </div>
          )}
        </div>
        <div>
          <div className="text-sm text-gray-500 font-mono mb-2">{bike.nrLf}</div>
          <h1 className="text-3xl font-bold mb-2">{[sanitize(bike.marke), sanitize(bike.modell)].filter(Boolean).join(' ')}</h1>
          {bike.farbe && <div className="text-gray-700 mb-4">{bike.farbe}</div>}
          {(bike.motor || bike.akku) && <div className="text-sm text-gray-700 mb-4">{bike.motor}{bike.motor && bike.akku ? ', ' : ''}{bike.akku}</div>}
          {!!bike.capacitiesWh?.length && (
            <div className="text-sm text-gray-700 mb-2">Baterie: {bike.capacitiesWh.join(', ')} Wh</div>
          )}
          {(() => {
            const cat = (bike['Categorie (PRGR)'] ?? bike.categoriePrgr ?? '').toString();
            return cat.toLowerCase() === 'unknown manual entry required' ? null : (
              <div className="text-sm text-gray-500">{cat}</div>
            );
          })()}
          {!!bike.sizes?.length && (
            <div className="text-sm text-gray-700 mt-3">Dostupné velikosti: {bike.sizes.join(', ')}</div>
          )}
        </div>
      </section>
    </main>
  );
}


