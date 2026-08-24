import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Návody | Klientská zóna Biketime',
  description: 'Technické návody a průvodci pro partnery Biketime.',
  robots: { index: false, follow: false },
};

type Guide = {
  href: string;
  title: string;
  description: string;
  tags: string[];
  meta: string;
};

const guides: Guide[] = [
  {
    href: '/navody/pinion',
    title: 'Pinion MGU: ovládání, aplikace a nastavení',
    description:
      'Jak ovládat pohon Pinion MGU E1.12 / E1.9, jakou aplikaci si stáhnout a jak ho nastavit. Funkce Smart.Shift, správné řazení, doladění motoru, údržba, chybová hlášení a checklist pro předání kola zákazníkovi.',
    tags: ['Pinion MGU', 'FIT E-Bike Control', 'BULLS Vuca EVO'],
    meta: 'Návod · lze stáhnout jako PDF',
  },
];

export default function ZonaNavodyPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Návody</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Technické návody a průvodci — k prostudování i k vytisknutí pro zákazníka. Návody jsou
          veřejné, takže odkaz můžete poslat i zákazníkovi.
        </p>
      </div>

      <div className="grid gap-4">
        {guides.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {g.meta}
            </p>
            <h2 className="mb-2 text-lg font-bold text-zinc-900 group-hover:text-primary">
              {g.title}
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-zinc-600">{g.description}</p>
            <div className="flex flex-wrap gap-2">
              {g.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        Chybí vám tu návod k něčemu konkrétnímu? Napište na{' '}
        <a href="mailto:info@biketime.cz" className="font-medium text-primary hover:underline">
          info@biketime.cz
        </a>{' '}
        a doplníme ho.
      </p>
    </div>
  );
}
