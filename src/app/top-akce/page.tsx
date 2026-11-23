'use client';

/**
 * TOP AKCE — akční nabídka kol pro schválené obchodníky. Stojí vedle
 * katalogu: celý seznam bez stránkování, jediný filtr Vše / Elektro /
 * Neelektro, karty seskupené podle modelu + barvy s výběrem velikostí.
 * Objednávka je jednoduchý „e-shopový" formulář; závaznou se stává až po
 * potvrzení z Biketime (kola jsou ve skladu výrobce).
 *
 * Data a ceny přicházejí hotové z /api/top-akce (CZK, dostupnost po odečtení
 * už objednaných kusů). Košík je lokální jen pro tuto stránku — záměrně
 * oddělený od běžného košíku katalogu, ať se nemíchají dva režimy cen.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { track } from '@/lib/analytics';
import { TOP_AKCE_PAUSED, TOP_AKCE_PAUSE_MESSAGE, TOP_AKCE_PAUSE_TITLE } from '@/lib/topAkcePause';

interface Item {
    artNr: string;
    groupKey: string;
    brand: string;
    model: string;
    year: number | null;
    isEbike: boolean;
    image: string | null;
    color: string | null;
    size: string | null;
    frameType: string | null;
    capacity: string | null;
    category: string | null;
    qtyDe: number;
    qtyAsi: number;
    ordered: number;
    available: number;
    vocCzk: number;
    uvpCzk: number | null;
    mocCzk: number;
    order: number;
}

interface Group {
    key: string;
    brand: string;
    model: string;
    year: number | null;
    isEbike: boolean;
    image: string | null;
    color: string | null;
    frameType: string | null;
    capacity: string | null;
    category: string | null;
    vocCzk: number;
    uvpCzk: number | null;
    mocCzk: number;
    items: Item[];
    available: number;
}

type Filter = 'all' | 'ebike' | 'non';

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

function groupItems(items: Item[]): Group[] {
    const map = new Map<string, Group>();
    for (const it of items) {
        const g = map.get(it.groupKey);
        if (g) {
            g.items.push(it);
            g.available += it.available;
            // Některé velikosti znají víc (fotku, barvu, kapacitu) než první řádek skupiny.
            if (!g.image && it.image) g.image = it.image;
            if (!g.color && it.color) g.color = it.color;
            if (!g.frameType && it.frameType) g.frameType = it.frameType;
            if (!g.capacity && it.capacity) g.capacity = it.capacity;
            if (!g.category && it.category) g.category = it.category;
            if (!g.year && it.year) g.year = it.year;
            continue;
        }
        map.set(it.groupKey, {
            key: it.groupKey,
            brand: it.brand,
            model: it.model,
            year: it.year,
            isEbike: it.isEbike,
            image: it.image,
            color: it.color,
            frameType: it.frameType,
            capacity: it.capacity,
            category: it.category,
            vocCzk: it.vocCzk,
            uvpCzk: it.uvpCzk,
            mocCzk: it.mocCzk,
            items: [it],
            available: it.available,
        });
    }
    return Array.from(map.values());
}

/* ───────────────────────── karta ───────────────────────── */
function OfferCard({ group, qty, onQty }: {
    group: Group;
    qty: Record<string, number>;
    onQty: (artNr: string, q: number) => void;
}) {
    const soldOut = group.available <= 0;
    const discount = group.uvpCzk && group.uvpCzk > group.mocCzk
        ? Math.round((1 - group.mocCzk / group.uvpCzk) * 100)
        : null;

    return (
        <article className={`bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col ${soldOut ? 'opacity-60' : ''}`}>
            <div className="relative aspect-[4/3] bg-zinc-50">
                {group.image ? (
                    <Image
                        src={getOptimizedImageUrl(group.image, 'medium', group.brand)}
                        alt={`${group.brand} ${group.model}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-4 mix-blend-multiply"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 gap-2">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                        <span className="text-xs">Fotka není k dispozici</span>
                    </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                    {group.year && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-900 text-white" title="Rok výroby">
                            {group.year}
                        </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${group.isEbike ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'}`}>
                        {group.isEbike ? 'Elektro' : 'Bez motoru'}
                    </span>
                </div>
                {discount != null && discount > 0 && (
                    <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-md bg-yellow-400 text-zinc-900">
                        −{discount} %
                    </span>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-400">{group.brand}{group.category ? ` · ${group.category}` : ''}</div>
                    <h2 className="font-bold text-zinc-900 leading-tight">{group.model}</h2>
                    {(group.color || group.frameType || group.capacity) && (
                        <div className="text-xs text-zinc-500 mt-0.5">
                            {[group.color, group.frameType, group.capacity ? (group.capacity.toLowerCase().includes('wh') ? group.capacity : `${group.capacity} Wh`) : ''].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </div>

                <div className="rounded-xl bg-zinc-50 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-zinc-500">VOC bez DPH</span>
                        <span className="text-2xl font-extrabold text-zinc-900 tabular-nums">{czk(group.vocCzk)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 mt-1">
                        <span className="text-xs text-zinc-500">MOC akční s DPH</span>
                        <span className="text-base font-bold text-red-600 tabular-nums">{czk(group.mocCzk)}</span>
                    </div>
                    {group.uvpCzk != null && (
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className="text-[11px] text-zinc-400">MOC</span>
                            <span className="text-xs text-zinc-400 line-through tabular-nums">{czk(group.uvpCzk)}</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5">Velikost · dostupné kusy</div>
                    <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                        {group.items.map(it => {
                            const q = qty[it.artNr] || 0;
                            const out = it.available <= 0;
                            return (
                                <li key={it.artNr} className="flex items-center gap-2 px-3 py-2 text-sm">
                                    <span className="font-semibold text-zinc-900 w-14 shrink-0">{it.size || '—'}</span>
                                    <span className={`flex-1 text-xs ${out ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {out ? 'vyprodáno' : (
                                            <>
                                                <span className="font-medium text-zinc-700">{it.available} ks</span>
                                                {it.qtyAsi > 0 && it.qtyDe < it.available && (
                                                    <span className="text-zinc-400"> · {Math.min(it.qtyAsi, it.available)} na cestě</span>
                                                )}
                                            </>
                                        )}
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-300 hidden sm:inline">{it.artNr}</span>
                                    {!out && (
                                        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden shrink-0 bg-white">
                                            <button
                                                onClick={() => onQty(it.artNr, q - 1)}
                                                disabled={q <= 0}
                                                className="w-7 h-8 text-zinc-500 hover:bg-zinc-50 disabled:text-zinc-200"
                                                aria-label="Méně kusů"
                                            >−</button>
                                            <span className={`w-7 text-center text-sm font-semibold ${q > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>{q}</span>
                                            <button
                                                onClick={() => onQty(it.artNr, q + 1)}
                                                disabled={q >= it.available}
                                                className="w-7 h-8 text-zinc-500 hover:bg-zinc-50 disabled:text-zinc-200"
                                                aria-label="Více kusů"
                                            >+</button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </article>
    );
}

/* ───────────────────────── objednávka ───────────────────────── */
function OrderPanel({ lines, total, count, onClose, onQty, onDone }: {
    lines: { item: Item; qty: number }[];
    total: number;
    count: number;
    onClose: () => void;
    onQty: (artNr: string, q: number) => void;
    onDone: (orderId: string) => void;
}) {
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const submit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await apiGet('/api/top-akce/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: lines.map(l => ({ artNr: l.item.artNr, quantity: l.qty })), note }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setError(data.error || 'Objednávku se nepodařilo odeslat.');
                return;
            }
            track('top_akce_order_submitted', { order_id: data.orderId, item_count: count, total_czk: data.totalCzk });
            onDone(data.orderId);
        } catch {
            setError('Objednávku se nepodařilo odeslat. Zkuste to prosím znovu.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
            <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-100">
                    <h2 className="text-lg font-bold text-zinc-900">Objednávka z TOP AKCE</h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700" aria-label="Zavřít">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-6 py-4 divide-y divide-zinc-100">
                    {lines.map(({ item, qty }) => (
                        <div key={item.artNr} className="py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-zinc-900 text-sm truncate">{item.brand} {item.model}{item.year ? ` (${item.year})` : ''}</div>
                                <div className="text-xs text-zinc-500">
                                    {[item.color, item.frameType, item.size ? `vel. ${item.size}` : ''].filter(Boolean).join(' · ')}
                                    <span className="font-mono text-zinc-300 ml-2">{item.artNr}</span>
                                </div>
                            </div>
                            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                                <button onClick={() => onQty(item.artNr, qty - 1)} className="w-7 h-8 text-zinc-500 hover:bg-zinc-50" aria-label="Méně kusů">−</button>
                                <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                                <button onClick={() => onQty(item.artNr, qty + 1)} disabled={qty >= item.available} className="w-7 h-8 text-zinc-500 hover:bg-zinc-50 disabled:text-zinc-200" aria-label="Více kusů">+</button>
                            </div>
                            <div className="w-28 text-right shrink-0">
                                <div className="font-bold text-zinc-900 text-sm tabular-nums">{czk(item.vocCzk * qty)}</div>
                                <div className="text-[11px] text-zinc-400">{czk(item.vocCzk)}/ks</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6">
                    <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Poznámka</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value.slice(0, 2000))}
                        rows={2}
                        placeholder="Např. požadovaný termín dodání…"
                        className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:ring-primary focus:border-primary mb-4"
                    />

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-zinc-500">{count} ks celkem</span>
                        <div className="text-right">
                            <div className="text-2xl font-extrabold text-zinc-900 tabular-nums">{czk(total)}</div>
                            <div className="text-xs text-zinc-400">VOC bez DPH</div>
                        </div>
                    </div>

                    <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs text-yellow-900 leading-relaxed">
                        Kola jsou ve skladu výrobce. Objednávka je <strong>nezávazná</strong> — ověříme dostupnost
                        a&nbsp;následně vám ji potvrdíme e-mailem včetně termínu dodání.
                    </div>

                    {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}

                    <button
                        onClick={submit}
                        disabled={submitting || lines.length === 0}
                        className="w-full py-3.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Odesílám…' : 'Odeslat objednávku k potvrzení'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── stránka ───────────────────────── */
export default function TopAkcePage() {
    const { firebaseUser, shopUser, loading: authLoading } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [intro, setIntro] = useState('');
    const [published, setPublished] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [qty, setQty] = useState<Record<string, number>>({});
    const [panelOpen, setPanelOpen] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    const canSee = !!firebaseUser && !!shopUser?.hasAccess;

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await apiGet('/api/top-akce', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) { setLoadError(data.error || 'Nabídku se nepodařilo načíst.'); return; }
            setItems(data.items || []);
            setIntro(data.intro || '');
            setPublished(data.published !== false);
            track('top_akce_viewed', { item_count: (data.items || []).length });
        } catch {
            setLoadError('Nabídku se nepodařilo načíst.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!canSee || TOP_AKCE_PAUSED) { setLoading(false); return; }
        load();
    }, [authLoading, canSee]);

    const groups = useMemo(() => groupItems(items), [items]);
    const counts = useMemo(() => ({
        all: groups.length,
        ebike: groups.filter(g => g.isEbike).length,
        non: groups.filter(g => !g.isEbike).length,
    }), [groups]);
    const visible = useMemo(
        () => filter === 'all' ? groups : groups.filter(g => filter === 'ebike' ? g.isEbike : !g.isEbike),
        [groups, filter],
    );

    const byArt = useMemo(() => new Map(items.map(i => [i.artNr, i])), [items]);
    const lines = useMemo(
        () => Object.entries(qty).filter(([, q]) => q > 0).map(([artNr, q]) => ({ item: byArt.get(artNr)!, qty: q })).filter(l => l.item),
        [qty, byArt],
    );
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.item.vocCzk * l.qty, 0);

    const setLineQty = (artNr: string, q: number) => {
        const it = byArt.get(artNr);
        const max = it ? it.available : 0;
        const next = Math.max(0, Math.min(max, q));
        setQty(prev => {
            const copy = { ...prev };
            if (next <= 0) delete copy[artNr]; else copy[artNr] = next;
            return copy;
        });
    };

    // Ruční pauza nabídky — stránka je nedostupná všem, i schváleným partnerům.
    if (TOP_AKCE_PAUSED) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center max-w-md">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-yellow-400 text-zinc-900 mb-4">TOP AKCE</span>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">{TOP_AKCE_PAUSE_TITLE}</h1>
                    <p className="text-sm text-zinc-500 mb-6">{TOP_AKCE_PAUSE_MESSAGE}</p>
                    <Link href="/zona/objednavky" className="inline-block px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl">
                        Moje objednávky
                    </Link>
                </div>
            </main>
        );
    }

    if (authLoading || (canSee && loading)) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </main>
        );
    }

    if (!canSee) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center max-w-md">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-yellow-400 text-zinc-900 mb-4">TOP AKCE</span>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Akční nabídka je pro partnery</h1>
                    <p className="text-sm text-zinc-500 mb-6">
                        Nabídku vidí jen přihlášení a schválení obchodníci.
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
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Objednávku jsme přijali</h1>
                    <p className="text-sm text-zinc-500 mb-1">
                        Zatím je nezávazná — ověříme dostupnost u výrobce a potvrzení vám pošleme e-mailem.
                    </p>
                    <p className="text-xs text-zinc-400 mb-6 font-mono">č. {orderId}</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/zona/objednavky" className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl">Moje objednávky</Link>
                        <button
                            onClick={() => { setOrderId(null); setQty({}); load(); }}
                            className="px-5 py-2.5 border border-zinc-200 text-sm font-medium text-zinc-700 rounded-xl hover:bg-zinc-50"
                        >
                            Zpět na TOP AKCE
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 pb-28">
            <div className="bg-yellow-400">
                <div className="container-custom py-8 sm:py-10">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">TOP AKCE</h1>
                            <p className="text-sm sm:text-base text-zinc-800 mt-1 max-w-2xl">
                                {intro || 'Speciální nabídka kol za akční ceny pro naše obchodníky. Kola jsou ve skladu výrobce, objednávky potvrzujeme individuálně.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-6">
                {!published ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200 text-zinc-400">
                        Akční nabídka momentálně není aktivní.
                    </div>
                ) : loadError ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{loadError}</div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
                                {([['all', 'Vše'], ['ebike', 'Elektro'], ['non', 'Neelektro']] as [Filter, string][]).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
                                    >
                                        {label} <span className={`ml-1 text-xs ${filter === key ? 'text-zinc-300' : 'text-zinc-400'}`}>{counts[key]}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="text-sm text-zinc-500">
                                {visible.length} {visible.length === 1 ? 'model' : visible.length < 5 ? 'modely' : 'modelů'} · {visible.reduce((s, g) => s + g.available, 0)} ks k dispozici
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200 text-zinc-400">
                                V této kategorii teď nic není.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {visible.map(g => <OfferCard key={g.key} group={g} qty={qty} onQty={setLineQty} />)}
                            </div>
                        )}
                    </>
                )}
            </div>

            {count > 0 && (
                <div className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                    <div className="container-custom py-3 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-zinc-900">{count} ks vybráno</div>
                            <div className="text-xs text-zinc-500">{czk(total)} VOC bez DPH</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setQty({})} className="hidden sm:inline-block px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-800">Vyprázdnit</button>
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold rounded-xl"
                            >
                                Objednat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {panelOpen && (
                <OrderPanel
                    lines={lines}
                    total={total}
                    count={count}
                    onClose={() => setPanelOpen(false)}
                    onQty={setLineQty}
                    onDone={(id) => { setPanelOpen(false); setOrderId(id); }}
                />
            )}
        </main>
    );
}
