import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOffer } from '@/lib/offers/getOffer';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import OfferActions from '@/components/offer/OfferActions';
import type { Offer, OfferItem } from '@/types/Offer';
import {
  eurToCzk,
  formatCzk,
  formatDate,
  formatEur,
  hasUniformPrice,
  sizePriceEur,
} from '@/lib/offers/format';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

// Offers are private, shareable links — never index them, but allow sharing.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const offer = await getOffer(token);
  return {
    title: offer?.title ? `${offer.title} – Biketime` : 'Nabídka – Biketime',
    robots: { index: false, follow: false, nocache: true },
  };
}

function OfferItemCard({ item, rate }: { item: OfferItem; rate: number }) {
  const img = item.imageUrl
    ? getOptimizedImageUrl(item.imageUrl, 'medium', item.brand)
    : null;
  const uniform = hasUniformPrice(item);
  const specEntries = Object.entries(item.specs ?? {});

  return (
    <article className="offer-card flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row">
      {/* Image */}
      <div className="flex w-full shrink-0 items-center justify-center sm:w-56">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-50">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={`${item.brand ?? ''} ${item.model}`.trim()}
              loading="eager"
              className="absolute inset-0 h-full w-full object-contain p-2 mix-blend-multiply"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
              Foto není k dispozici
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {item.brand && (
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {item.brand}
            </span>
          )}
          {item.year && <span className="text-xs text-zinc-400">{item.year}</span>}
        </div>
        <h3 className="text-lg font-bold leading-tight text-zinc-900">{item.model}</h3>
        {item.color && <p className="text-sm text-zinc-500">{item.color}</p>}

        {/* Headline chips */}
        {(item.motor || item.battery) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.motor && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {item.motor}
              </span>
            )}
            {item.battery && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {item.battery}
              </span>
            )}
          </div>
        )}

        {/* Specs */}
        {specEntries.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600">
            {specEntries.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 border-b border-dashed border-zinc-100 py-0.5">
                <dt className="text-zinc-400">{label}</dt>
                <dd className="text-right font-medium text-zinc-700">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Code + sizes + price */}
        <div className="mt-auto pt-3">
          <div className="text-[11px] text-zinc-400">
            NRLF: <span className="font-mono">{item.nrLf}</span>
          </div>

          {uniform ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1 text-xs text-zinc-400">Velikosti</div>
                <div className="flex flex-wrap gap-1.5">
                  {item.sizes.map((s) => (
                    <span
                      key={s.size}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-sm font-medium text-zinc-700"
                    >
                      {s.size}
                      {s.quantity ? <span className="text-zinc-400"> · {s.quantity} ks</span> : null}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-zinc-900">{formatEur(item.priceEur)}</div>
                <div className="text-sm text-zinc-500">{formatCzk(eurToCzk(item.priceEur, rate))}</div>
              </div>
            </div>
          ) : (
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-400">
                  <th className="py-1 font-medium">Velikost</th>
                  <th className="py-1 text-right font-medium">Cena (EUR)</th>
                  <th className="py-1 text-right font-medium">Cena (CZK)</th>
                </tr>
              </thead>
              <tbody>
                {item.sizes.map((s) => {
                  const eur = sizePriceEur(item, s);
                  return (
                    <tr key={s.size} className="border-t border-zinc-100">
                      <td className="py-1 font-medium text-zinc-700">
                        {s.size}
                        {s.quantity ? <span className="text-zinc-400"> · {s.quantity} ks</span> : null}
                      </td>
                      <td className="py-1 text-right font-semibold text-zinc-900">{formatEur(eur)}</td>
                      <td className="py-1 text-right text-zinc-500">{formatCzk(eurToCzk(eur, rate))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {item.note && <p className="mt-2 text-xs italic text-zinc-500">{item.note}</p>}
        </div>
      </div>
    </article>
  );
}

function OfferHeader({ offer }: { offer: Offer }) {
  const validUntil = formatDate(offer.validUntil);
  return (
    <header className="offer-header rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-2xl font-black tracking-tight text-primary">BIKETIME</div>
          <p className="text-xs text-zinc-400">Oficiální distribuce kol BULLS</p>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-900 sm:text-3xl">
            {offer.title ?? 'Cenová nabídka'}
          </h1>
        </div>

        <div className="text-sm text-zinc-600">
          <dl className="space-y-1">
            {offer.client.company && (
              <div className="flex gap-2">
                <dt className="text-zinc-400">Pro:</dt>
                <dd className="font-semibold text-zinc-900">{offer.client.company}</dd>
              </div>
            )}
            {offer.client.contactName && (
              <div className="flex gap-2">
                <dt className="text-zinc-400">Kontakt:</dt>
                <dd>{offer.client.contactName}</dd>
              </div>
            )}
            {offer.client.email && (
              <div className="flex gap-2">
                <dt className="text-zinc-400">E-mail:</dt>
                <dd>{offer.client.email}</dd>
              </div>
            )}
            {validUntil && (
              <div className="flex gap-2">
                <dt className="text-zinc-400">Platnost do:</dt>
                <dd className="font-semibold text-zinc-900">{validUntil}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <p className="mt-6 rounded-lg bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
        Všechny ceny jsou nákupní, <strong className="text-zinc-700">bez DPH</strong>. Přepočet z EUR
        kurzem <strong className="text-zinc-700">1 EUR = {offer.eurToCzk} CZK</strong>.
      </p>
    </header>
  );
}

export default async function OfferPage({ params }: PageProps) {
  const { token } = await params;
  const offer = await getOffer(token);

  if (!offer) notFound();

  return (
    <main className="offer-page min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="no-print mb-6 flex justify-end">
          <OfferActions token={offer.id} />
        </div>

        <OfferHeader offer={offer} />

        <section className="mt-6 space-y-4">
          {offer.items.map((item) => (
            <OfferItemCard key={item.id} item={item} rate={offer.eurToCzk} />
          ))}
        </section>

        <footer className="offer-footer mt-8 text-center text-xs text-zinc-400">
          Nabídka vygenerována na biketime.cz · Ceny bez DPH · Nezávazná cenová nabídka
        </footer>
      </div>
    </main>
  );
}
