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
    marke?: string;
    modell?: string;
    bild1?: string;
    farbe?: string;
    motor?: string;
    akku?: string;
    sizes?: string[];
    capacitiesWh?: number[];
    [key: string]: unknown;
  };
  const [bike, setBike] = useState<Bike | null>(null);
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
            <Image src="/biketime-logo.png" alt="BikeTime" width={120} height={28} className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-white border rounded">
          {typeof bike.bild1 === 'string' && bike.bild1.length > 0 ? (
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
              title: 'General',
              fields: [
                { label: 'Marke', keys: ['marke', 'Marke'] },
                { label: 'Modell', keys: ['modell', 'Modell'] },
                { label: 'Produkt', keys: ['Produkt'] },
                { label: 'Kategorie (PRGR)', keys: ['Categorie (PRGR)', 'Category (PRGR)', 'categoriePrgr', 'categoryPrgr'] },
              ],
            },
            {
              title: 'Frame & Suspension',
              fields: [
                { label: 'Rahmen (RAHM)', keys: ['Rahmen (RAHM)'] },
                { label: 'Gabel (GABE)', keys: ['Gabel (GABE)'] },
                { label: 'Dämpfer (DAMP)', keys: ['Dämpfer (DAMP)'] },
                { label: 'Federweg VR (FWR)', keys: ['Federweg VR (FWR)'] },
                { label: 'Federweg HR (FHR)', keys: ['Federweg HR (FHR)'] },
              ],
            },
            {
              title: 'Drivetrain & Brakes',
              fields: [
                { label: 'Schaltung (SCHL)', keys: ['Schaltung (SCHL)'] },
                { label: 'Kurbelsatz (KURA)', keys: ['Kurbelsatz (KURA)'] },
                { label: 'Kassette (KASS)', keys: ['Kassette (KASS)'] },
                { label: 'Kette (KETT)', keys: ['Kette (KETT)'] },
                { label: 'Bremse VR (BRVR)', keys: ['Bremse VR (BRVR)'] },
                { label: 'Bremse HR (BRHR)', keys: ['Bremse HR (BRHR)'] },
              ],
            },
            {
              title: 'Wheels & Tires',
              fields: [
                { label: 'Felge (FELG)', keys: ['Felge (FELG)'] },
                { label: 'Reifen VR (RVR)', keys: ['Reifen VR (RVR)'] },
                { label: 'Reifen HR (RHR)', keys: ['Reifen HR (RHR)'] },
                { label: 'Laufradgröße (LRGR)', keys: ['Laufradgröße (LRGR)'] },
              ],
            },
            {
              title: 'E-Bike System',
              condition: isEbike,
              fields: [
                { label: 'Motor (MOTO)', keys: ['Motor (MOTO)', 'motor'] },
                { label: 'Motorleistung (W) (MOPW)', keys: ['Motorleistung (W) (MOPW)'] },
                { label: 'Drehmoment (Nm) (MOTQ)', keys: ['Drehmoment (Nm) (MOTQ)'] },
                { label: 'Akku (AKKU)', keys: ['Akku (AKKU)', 'Akku'] },
                { label: 'Akkukapazität (Wh) (AKWH)', keys: ['Akkukapazität (Wh) (AKWH)'] },
                { label: 'Display (DISP)', keys: ['Display (DISP)'] },
                { label: 'Ladegerät (LADG)', keys: ['Ladegerät (LADG)'] },
              ],
            },
            {
              title: 'Key Features / Accessories',
              fields: [
                { label: 'Sattel (SATT)', keys: ['Sattel (SATT)'] },
                { label: 'Sattelstütze (STZT)', keys: ['Sattelstütze (STZT)'] },
                { label: 'Vorbau (VORB)', keys: ['Vorbau (VORB)'] },
                { label: 'Lenker (LENK)', keys: ['Lenker (LENK)'] },
                { label: 'Licht VR (FRLI)', keys: ['Licht VR (FRLI)'] },
                { label: 'Licht HR (RLIC)', keys: ['Licht HR (RLIC)'] },
                { label: 'Gepäckträger (GEPK)', keys: ['Gepäckträger (GEPK)'] },
                { label: 'Ständer (STAN)', keys: ['Ständer (STAN)'] },
              ],
            },
            {
              title: 'Weight',
              fields: [
                { label: 'Gewicht (GEWI)', keys: ['Gewicht (GEWI)'] },
                { label: 'Gewicht ohne Akku (GWAK)', keys: ['Gewicht ohne Akku (GWAK)'] },
              ],
            },
          ];

          const renderRow = (label: string, value: string) => (
            <div key={label} className="grid grid-cols-3 gap-4 py-2 border-b">
              <div className="col-span-1 text-gray-500 text-sm">{label}</div>
              <div className="col-span-2 text-sm text-gray-800">{value}</div>
            </div>
          );

          return (
            <div className="bg-white border rounded-lg overflow-hidden">
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
    </main>
  );
}


