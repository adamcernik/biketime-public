import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ke stažení — návody a materiály | Biketime.cz",
  description:
    "Návody, průvodci a materiály ke stažení pro partnery a majitele kol BULLS.",
};

const items = [
  {
    href: "/navody/pinion",
    title: "Pinion MGU: ovládání, aplikace a nastavení",
    description:
      "Kompletní návod k pohonu Pinion MGU E1.12 / E1.9 — ovládání, aplikace FIT E-Bike Control, funkce Smart.Shift, správné řazení, údržba a chybová hlášení.",
    meta: "Návod · lze stáhnout jako PDF",
  },
  {
    href: "/size-guide",
    title: "Tabulka velikostí BULLS",
    description: "Jak vybrat správnou velikost rámu podle výšky postavy.",
    meta: "Tabulka",
  },
];

export default function KeStazeniPage() {
  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container-custom py-8 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">Ke stažení</h1>
            <p className="text-zinc-600">
              Návody a materiály pro majitele kol BULLS i pro naše partnery. Průběžně doplňujeme.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 sm:py-12">
        <div className="mx-auto grid max-w-4xl gap-4">
          {items.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-colors hover:border-primary/40"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {g.meta}
              </p>
              <h2 className="mb-2 text-lg font-bold text-zinc-900 group-hover:text-primary">
                {g.title}
              </h2>
              <p className="text-[15px] leading-relaxed text-zinc-600">{g.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
