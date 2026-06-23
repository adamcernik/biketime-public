/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { apiGet } from "@/lib/clientApi";
/**
 * Biketime nabídka — client-only in-stock offer.
 * Lists every product currently in B2B stock (admin /admin/sklad → products_v2),
 * with dealer (VOC) prices. Accessible ONLY to logged-in, approved shop users;
 * VOC prices can be hidden via the shared hideB2BPrices toggle.
 * Two layouts: grid (cards) and list (rows), switchable at the top.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import ProductCardV2 from '@/components/ProductCardV2';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { dealerPriceForMoc } from '@/lib/b2bPrice';

const fmtCzk = (n: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

/** Compact row layout for the list view (mirrors ProductCardV2 pricing). */
function OfferRow({ product }: { product: any }) {
  const { shopUser, hideB2BPrices } = useAuth();
  const image = product.primaryImage || product.images?.[0];
  const sizes: string[] = (product.stockSizes && product.stockSizes.length ? product.stockSizes : product.sizes) || [];

  let voc: number | null = null;
  if (shopUser && !hideB2BPrices) {
    const priceLevel = shopUser.priceLevel as 'A' | 'B' | 'C' | 'D' | undefined;
    voc = dealerPriceForMoc(product, priceLevel, product.minPrice);
    const manual = Number(product.manualB2BPrice) || Number(product.b2bPrice) || 0;
    if (manual > 0) voc = manual;
  }

  return (
    <Link
      href={`/catalog/${product.id}`}
      className="flex items-center gap-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all p-3"
    >
      <div className="relative w-20 h-16 flex-shrink-0 bg-zinc-50 rounded-lg overflow-hidden">
        {image ? (
          <Image src={getOptimizedImageUrl(image, 'small', product.brand)} alt={product.model} fill className="object-contain mix-blend-multiply" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-300">Bez foto</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-primary font-bold">{product.brand}</div>
        <div className="font-semibold text-zinc-900 truncate">{product.model}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {sizes.slice(0, 8).map((s) => (
            <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">{s}</span>
          ))}
        </div>
      </div>

      <div className="hidden md:block text-xs text-zinc-500 w-28 truncate">{product.specs?.capacity || ''}</div>

      <div className="text-right flex-shrink-0 w-32">
        <div className="text-lg font-bold text-zinc-900">
          {product.minPrice === product.maxPrice ? fmtCzk(product.minPrice) : (
            <><span className="text-xs font-normal text-zinc-500 mr-1">od</span>{fmtCzk(product.minPrice)}</>
          )}
        </div>
        {voc ? (
          <div className="text-sm font-bold text-primary leading-tight">
            {fmtCzk(voc)} <span className="text-[9px] text-zinc-500 uppercase">bez DPH</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function BiketimeNabidkaPage() {
  const { firebaseUser, shopUser, loading, hideB2BPrices, toggleHideB2BPrices } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const canView = !!firebaseUser && !!shopUser?.hasAccess;

  // remember the chosen layout
  useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('nabidkaView') : null;
    if (v === 'grid' || v === 'list') setView(v);
  }, []);
  const chooseView = (v: 'grid' | 'list') => { setView(v); try { localStorage.setItem('nabidkaView', v); } catch { /* ignore */ } };

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      const all: any[] = [];
      let page = 1;
      try {
        while (true) {
          const res = await apiGet(`/api/catalog?inStock=true&page=${page}&pageSize=100`);
          const data = await res.json();
          all.push(...((data.products ?? []) as any[]));
          const totalPages = Number(data.pagination?.totalPages ?? 1) || 1;
          if (page >= totalPages) break;
          page += 1;
        }
      } catch (e) {
        console.error('Failed to load nabídka:', e);
      }
      if (!cancelled) { setProducts(all); setLoadingProducts(false); }
    })();
    return () => { cancelled = true; };
  }, [canView]);

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
          <h2 className="text-xl font-bold mb-3">Nabídka skladem</h2>
          <p className="text-zinc-600 mb-6">Tato nabídka je dostupná pouze přihlášeným klientům.</p>
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
          <p className="text-zinc-600 mb-6">Váš účet zatím nemá schválený přístup k velkoobchodní nabídce. Po schválení administrátorem zde uvidíte všechna skladová kola.</p>
          <Link href="/zona" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Klientská zóna
          </Link>
        </section>
      </main>
    );
  }

  // --- offer -------------------------------------------------------------
  const iconBtn = (active: boolean) =>
    `p-2 rounded-md transition-colors ${active ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`;

  return (
    <main className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Nabídka skladem</h1>
            <p className="text-zinc-600 mt-1">
              Aktuálně skladem
              {!loadingProducts && <span className="font-semibold"> · {products.length} {products.length === 1 ? 'model' : products.length < 5 ? 'modely' : 'modelů'}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* layout switch */}
            <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
              <button onClick={() => chooseView('grid')} className={iconBtn(view === 'grid')} title="Dlaždice" aria-label="Zobrazit jako dlaždice" aria-pressed={view === 'grid'}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              </button>
              <button onClick={() => chooseView('list')} className={iconBtn(view === 'list')} title="Řádky" aria-label="Zobrazit jako řádky" aria-pressed={view === 'list'}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>

            <button
              onClick={toggleHideB2BPrices}
              className="text-sm font-medium px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              {hideB2BPrices ? 'Zobrazit VOC ceny' : 'Skrýt VOC ceny'}
            </button>
          </div>
        </div>

        {loadingProducts ? (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-zinc-500">
            Momentálně nemáme žádná kola skladem.
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCardV2 key={product._uniqueKey || product.id} product={product} detailBasePath="/catalog" activeCapacity="" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <OfferRow key={product._uniqueKey || product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
