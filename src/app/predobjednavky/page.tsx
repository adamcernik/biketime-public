/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Předobjednávky — curated preorder offer for approved dealers.
 * The product set comes from settings/preorders (admin-maintained id list),
 * so it can mix 2027 preorder-only bikes with selected earlier models.
 * Dealers pick variant quantities (color × frame × battery × size) and submit
 * one preorder; it is stored in preorder_orders and e-mailed both ways.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { sortSizes } from '@/lib/size-mapping';
import { dealerPriceForMoc } from '@/lib/b2bPrice';

const fmtCzk = (n: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

/** Ceník 2027 kategorie — order-volume based dealer prices (bez DPH). */
const CATEGORY_LABELS: { level: 'A' | 'B' | 'C'; label: string }[] = [
  { level: 'A', label: 'bez předobjednávky' },
  { level: 'B', label: 'do 500 tis.' },
  { level: 'C', label: 'nad 500 tis.' },
];

interface ConfigRow {
  key: string;
  color: string;
  frameShape: string;
  capacity: string;
  variants: any[]; // sorted by size
}

/** Group a product's variants into order rows: one per color × frame × battery. */
function buildConfigRows(product: any): ConfigRow[] {
  const map = new Map<string, ConfigRow>();
  for (const v of product.variants || []) {
    const key = [v.color || '', v.frameShape || '', v.capacity || ''].join('|');
    if (!map.has(key)) {
      map.set(key, { key: `${product.id}|${key}`, color: v.color || '', frameShape: v.frameShape || '', capacity: v.capacity || '', variants: [] });
    }
    map.get(key)!.variants.push(v);
  }
  const rows = [...map.values()];
  for (const r of rows) r.variants.sort((a, b) => sortSizes(a.size || '', b.size || ''));
  rows.sort((a, b) => a.color.localeCompare(b.color) || a.frameShape.localeCompare(b.frameShape) || a.capacity.localeCompare(b.capacity));
  return rows;
}

function ProductBlock({
  product,
  quantities,
  setQty,
}: {
  product: any;
  quantities: Record<string, number>;
  setQty: (productId: string, variantId: string, qty: number) => void;
}) {
  const { hideB2BPrices } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => buildConfigRows(product), [product]);
  const image = product.primaryImage || product.images?.[0];
  const inOrder = (product.variants || []).reduce(
    (s: number, v: any) => s + (quantities[`${product.id}|${v.id}`] || 0),
    0,
  );

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="relative w-24 h-18 sm:w-28 sm:h-20 flex-shrink-0 bg-zinc-50 rounded-lg overflow-hidden">
          {image ? (
            <Image src={getOptimizedImageUrl(image, 'small', product.brand)} alt={product.model} fill className="object-contain mix-blend-multiply" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-300">Bez foto</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-primary font-bold">{product.brand}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">{product.year}</span>
          </div>
          <div className="font-semibold text-zinc-900 truncate">{product.model}</div>
          <div className="text-xs text-zinc-500 mt-0.5 truncate">
            {[product.specs?.modelSeries, product.specs?.capacity && `${(product.colors || []).length} barvy`, `${(product.variants || []).length} variant`]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {product.minPrice > 0 && (
            <div className="text-sm font-bold text-zinc-900 mt-0.5">
              {product.minPrice === product.maxPrice ? fmtCzk(product.minPrice) : `od ${fmtCzk(product.minPrice)}`}
              <span className="text-[10px] font-normal text-zinc-400 ml-1">MOC s DPH</span>
            </div>
          )}
        </div>

        {inOrder > 0 && (
          <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-primary text-white">{inOrder} ks</span>
        )}
        <svg
          className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 p-4 space-y-3">
          <div className="flex justify-end">
            <Link href={`/catalog/${product.id}`} className="text-xs font-medium text-primary hover:underline">
              Zobrazit detail kola →
            </Link>
          </div>
          {rows.map((row) => {
            const rowMoc = Number(row.variants.find((v: any) => Number(v.price) > 0)?.price) || 0;
            return (
            <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-zinc-50 px-3 py-2">
              <div className="text-sm text-zinc-700 min-w-[180px] flex-1">
                <span className="font-medium">{row.color}</span>
                {row.frameShape && <span className="text-zinc-400"> · {row.frameShape}</span>}
                {row.capacity && <span className="text-zinc-400"> · {row.capacity}</span>}
                <div className="text-xs mt-0.5">
                  {rowMoc > 0 ? (
                    <>
                      <span className="font-semibold text-zinc-900">{fmtCzk(rowMoc)}</span>
                      <span className="text-zinc-400"> MOC</span>
                      {!hideB2BPrices && CATEGORY_LABELS.map(({ level, label }) => {
                        const voc = dealerPriceForMoc(product, level, rowMoc);
                        return voc ? (
                          <span key={level} className="text-zinc-500">
                            {' · '}
                            <span className="font-medium text-primary">{level}: {fmtCzk(voc)}</span>
                            <span className="text-zinc-400"> ({label})</span>
                          </span>
                        ) : null;
                      })}
                    </>
                  ) : (
                    <span className="text-zinc-400">Cena bude upřesněna</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.variants.map((v: any) => {
                  const qty = quantities[`${product.id}|${v.id}`] || 0;
                  return (
                    <label key={v.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${qty > 0 ? 'border-primary bg-white' : 'border-zinc-200 bg-white'}`}>
                      <span className={`text-xs font-bold w-7 ${qty > 0 ? 'text-primary' : 'text-zinc-600'}`}>{v.size}</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={qty === 0 ? '' : qty}
                        placeholder="0"
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setQty(product.id, v.id, Number.isFinite(n) ? Math.max(0, Math.min(99, n)) : 0);
                        }}
                        className="w-12 text-sm text-center border border-zinc-200 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PredobjednavkyPage() {
  const { firebaseUser, shopUser, loading, hideB2BPrices, toggleHideB2BPrices } = useAuth();
  const [data, setData] = useState<{ enabled: boolean; title: string; products: any[] } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedOrderId, setSubmittedOrderId] = useState('');

  const canView = !!firebaseUser && !!shopUser?.hasAccess;

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const res = await apiGet('/api/preorders');
        const json = await res.json();
        if (!cancelled) setData(res.ok ? json : { enabled: false, title: 'Předobjednávky 2027', products: [] });
      } catch (e) {
        console.error('Failed to load preorders:', e);
        if (!cancelled) setData({ enabled: false, title: 'Předobjednávky 2027', products: [] });
      }
      if (!cancelled) setLoadingData(false);
    })();
    return () => { cancelled = true; };
  }, [canView]);

  const setQty = (productId: string, variantId: string, qty: number) => {
    setQuantities((q) => {
      const key = `${productId}|${variantId}`;
      const next = { ...q };
      if (qty <= 0) delete next[key];
      else next[key] = qty;
      return next;
    });
  };

  const orderLines = useMemo(() => {
    if (!data) return [];
    const lines: { productId: string; variantId: string; quantity: number; label: string; sub: string }[] = [];
    for (const p of data.products) {
      for (const v of p.variants || []) {
        const qty = quantities[`${p.id}|${v.id}`];
        if (qty) {
          lines.push({
            productId: p.id,
            variantId: v.id,
            quantity: qty,
            label: `${p.brand} ${p.model}`,
            sub: [v.color, v.frameShape, v.capacity, `vel. ${v.size}`].filter(Boolean).join(' · '),
          });
        }
      }
    }
    return lines;
  }, [data, quantities]);
  const totalQty = orderLines.reduce((s, l) => s + l.quantity, 0);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await apiGet('/api/preorders/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderLines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
          note,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json?.error || 'Odeslání se nezdařilo, zkuste to prosím znovu.');
      } else {
        setSubmittedOrderId(json.orderId || 'ok');
        setQuantities({});
        setNote('');
        setSummaryOpen(false);
      }
    } catch {
      setSubmitError('Odeslání se nezdařilo, zkuste to prosím znovu.');
    }
    setSubmitting(false);
  };

  // --- auth gating -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <section className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-3">Předobjednávky</h2>
          <p className="text-zinc-600 mb-6">Předobjednávky jsou dostupné pouze přihlášeným klientům.</p>
          <Link href="/login" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Přihlásit se
          </Link>
        </section>
      </main>
    );
  }

  if (!shopUser?.hasAccess) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <section className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-3">Účet čeká na schválení</h2>
          <p className="text-zinc-600 mb-6">Váš účet zatím nemá schválený přístup. Po schválení administrátorem zde uvidíte předobjednávkovou nabídku.</p>
          <Link href="/zona" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Klientská zóna
          </Link>
        </section>
      </main>
    );
  }

  // --- content -----------------------------------------------------------
  return (
    <main className="min-h-screen bg-zinc-50 py-10 px-4 pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{data?.title || 'Předobjednávky 2027'}</h1>
            <p className="text-zinc-600 mt-1">
              Vyberte varianty a počty kusů, které chcete předobjednat.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              VOC kategorie (bez DPH): <strong>A</strong> bez předobjednávky · <strong>B</strong> předobjednávka do 500 000 Kč · <strong>C</strong> předobjednávka nad 500 000 Kč
            </p>
          </div>
          <button
            onClick={toggleHideB2BPrices}
            className="text-sm font-medium px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {hideB2BPrices ? 'Zobrazit VOC ceny' : 'Skrýt VOC ceny'}
          </button>
        </div>

        {submittedOrderId && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="font-bold text-green-800 mb-1">Předobjednávka odeslána ✓</div>
            <p className="text-sm text-green-700">
              Děkujeme! Potvrzení jsme poslali na váš e-mail a brzy se vám ozveme.
            </p>
            <button onClick={() => setSubmittedOrderId('')} className="mt-3 text-sm font-medium text-green-800 underline">
              Vytvořit další předobjednávku
            </button>
          </div>
        )}

        {loadingData ? (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : !data?.enabled || data.products.length === 0 ? (
          !submittedOrderId && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-zinc-500">
              Předobjednávky nejsou momentálně otevřené.
            </div>
          )
        ) : (
          <div className="space-y-3">
            {data.products.map((p) => (
              <ProductBlock key={p.id} product={p} quantities={quantities} setQty={setQty} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky order bar */}
      {totalQty > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-5xl mx-auto px-4 py-3">
            {summaryOpen && (
              <div className="max-h-72 overflow-y-auto mb-3 border-b border-zinc-100 pb-3">
                <div className="space-y-1.5">
                  {orderLines.map((l) => (
                    <div key={`${l.productId}|${l.variantId}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <span className="font-medium text-zinc-900">{l.label}</span>
                        <span className="text-zinc-500"> — {l.sub}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold">{l.quantity}×</span>
                        <button
                          onClick={() => setQty(l.productId, l.variantId, 0)}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                          title="Odebrat"
                          aria-label={`Odebrat ${l.label} ${l.sub}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  placeholder="Poznámka k předobjednávce (nepovinné)"
                  className="mt-3 w-full text-sm border border-zinc-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={2}
                />
                {submitError && <div className="mt-2 text-sm text-red-600">{submitError}</div>}
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setSummaryOpen((o) => !o)}
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5"
              >
                <span className="font-bold text-zinc-900">{totalQty} {totalQty === 1 ? 'kus' : totalQty < 5 ? 'kusy' : 'kusů'}</span>
                v předobjednávce
                <svg className={`w-4 h-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <button
                onClick={() => (summaryOpen ? submit() : setSummaryOpen(true))}
                disabled={submitting}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Odesílám…' : summaryOpen ? 'Odeslat předobjednávku' : 'Zkontrolovat a odeslat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
