'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { apiGet } from '@/lib/clientApi';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { track } from '@/lib/analytics';

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
    const { firebaseUser, shopUser, loading } = useAuth();
    const { items, count, setQty, removeItem, clear } = useCart();
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    const total = items.reduce((s, i) => s + (i.dealerPrice || 0) * i.qty, 0);
    const hasUnknownPrices = items.some(i => i.dealerPrice == null);

    const submit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await apiGet('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
                    note,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data.error || 'Objednávku se nepodařilo odeslat.');
                return;
            }
            track('order_submitted', { order_id: data.orderId, item_count: count, total_czk: data.totalCzk });
            setOrderId(data.orderId);
            clear();
        } catch {
            setError('Objednávku se nepodařilo odeslat. Zkuste to prosím znovu.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </main>
        );
    }

    if (!firebaseUser || !shopUser?.hasAccess) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center max-w-md">
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Košík je pro partnery</h1>
                    <p className="text-sm text-zinc-500 mb-6">
                        Objednávat mohou jen přihlášení a schválení obchodníci.
                    </p>
                    <Link href="/login" className="inline-block px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl">
                        Přihlásit se
                    </Link>
                </div>
            </main>
        );
    }

    if (orderId) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center max-w-md">
                    <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Objednávka odeslána</h1>
                    <p className="text-sm text-zinc-500 mb-1">
                        Potvrzení jsme poslali na váš e-mail a brzy se ozveme s termínem dodání.
                    </p>
                    <p className="text-xs text-zinc-400 mb-6 font-mono">č. {orderId}</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/zona/objednavky" className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl">
                            Moje objednávky
                        </Link>
                        <Link href="/catalog" className="px-5 py-2.5 border border-zinc-200 text-sm font-medium text-zinc-700 rounded-xl hover:bg-zinc-50">
                            Zpět do katalogu
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            <div className="container-custom py-8 max-w-4xl">
                <h1 className="text-2xl font-bold text-zinc-900 mb-6">Košík</h1>

                {items.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200">
                        <p className="text-zinc-400 text-lg mb-4">Košík je prázdný.</p>
                        <Link href="/catalog" className="text-primary font-medium hover:underline">
                            Přejít do katalogu →
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-100 mb-6">
                            {items.map(item => (
                                <div key={`${item.productId}|${item.variantId}`} className="p-4 flex gap-4 items-center">
                                    <div className="w-20 h-16 relative bg-zinc-50 rounded-lg shrink-0 overflow-hidden">
                                        {item.image && (
                                            <Image
                                                src={getOptimizedImageUrl(item.image, 'small', item.brand)}
                                                alt={item.model}
                                                fill
                                                className="object-contain mix-blend-multiply"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/catalog/${item.productId}`} className="font-bold text-zinc-900 hover:text-primary line-clamp-1">
                                            {item.brand} {item.model}{item.year ? ` (${item.year})` : ''}
                                        </Link>
                                        <div className="text-xs text-zinc-500 mt-0.5">
                                            {[item.color, item.frameShape, item.capacity ? (item.capacity.toLowerCase().includes('wh') ? item.capacity : `${item.capacity} Wh`) : '', item.size ? `vel. ${item.size}` : ''].filter(Boolean).join(' · ')}
                                        </div>
                                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{item.variantId}</div>
                                    </div>
                                    <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                                        <button
                                            onClick={() => setQty(item.productId, item.variantId, item.qty - 1)}
                                            className="w-8 h-9 text-zinc-500 hover:bg-zinc-50"
                                            aria-label="Méně kusů"
                                        >−</button>
                                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                                        <button
                                            onClick={() => setQty(item.productId, item.variantId, item.qty + 1)}
                                            className="w-8 h-9 text-zinc-500 hover:bg-zinc-50"
                                            aria-label="Více kusů"
                                        >+</button>
                                    </div>
                                    <div className="w-28 text-right shrink-0">
                                        {item.dealerPrice != null ? (
                                            <>
                                                <div className="font-bold text-zinc-900">{czk(item.dealerPrice * item.qty)}</div>
                                                <div className="text-[11px] text-zinc-400">{czk(item.dealerPrice)}/ks bez DPH</div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-zinc-400">cena bude potvrzena</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.productId, item.variantId)}
                                        className="p-2 text-zinc-300 hover:text-red-500 shrink-0"
                                        aria-label="Odebrat z košíku"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                            <label className="block text-sm font-semibold text-zinc-900 mb-2">Poznámka k objednávce</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value.slice(0, 2000))}
                                rows={3}
                                placeholder="Např. požadovaný termín dodání, dotaz…"
                                className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-primary focus:border-primary mb-4"
                            />

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-zinc-500">{count} ks celkem</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-zinc-900">{czk(total)}</div>
                                    <div className="text-xs text-zinc-400">
                                        orientační VOC bez DPH{hasUnknownPrices ? ' (některé ceny budou potvrzeny)' : ''} — závazné ceny potvrdíme
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
                            )}

                            <button
                                onClick={submit}
                                disabled={submitting}
                                className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Odesílám…' : 'Odeslat objednávku'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
