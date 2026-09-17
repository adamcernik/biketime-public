'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';
import { track } from '@/lib/analytics';

// Produktové feedy pro partnery: trvalá tajná URL (XML/CSV/JSON), kterou si
// partner vloží do svého e-shopu. Nastavení filtrů se ukládá k účtu, takže
// URL zůstává stabilní. Regenerace tokenu starou URL okamžitě zneplatní.

interface FeedSettings {
    ebike: 'all' | 'ebike' | 'bike';
    onlyAvailable: boolean;
}

interface FeedState {
    token: string;
    settings: FeedSettings;
    lastFetchAt: string | null;
    lastFetchFormat: string | null;
}

const FORMATS: { format: 'xml' | 'csv' | 'json' | 'heureka'; label: string; note: string }[] = [
    { format: 'xml', label: 'XML', note: 'Univerzální formát pro napojení e-shopu (Shoptet, WooCommerce, Upgates…)' },
    { format: 'heureka', label: 'Heureka XML', note: 'Struktura Heureka feedu — Shoptet a řada dalších e-shopů ji importují bez mapování. Obsahuje jen MOC s DPH (bez vaší VOC) a jen prodejné položky.' },
    { format: 'csv', label: 'CSV', note: 'Tabulka — otevře se i v Excelu (oddělovač středník)' },
    { format: 'json', label: 'JSON', note: 'Pro vlastní vývoj a moderní integrace' },
];

export default function FeedyPage() {
    const { firebaseUser, shopUser } = useAuth();
    const [state, setState] = useState<FeedState | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [regenOpen, setRegenOpen] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        if (!firebaseUser || !shopUser?.hasAccess) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await apiGet('/api/feeds/settings', { cache: 'no-store' });
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) setLoadError(data.error || 'Feed se nepodařilo načíst.');
                else setState(data);
            } catch {
                if (!cancelled) setLoadError('Feed se nepodařilo načíst.');
            }
        })();
        return () => { cancelled = true; };
    }, [firebaseUser, shopUser?.hasAccess]);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://biketime.cz';
    const feedUrl = (format: string) =>
        state ? `${origin}/api/feeds/catalog?token=${state.token}&format=${format}` : '';

    const copyUrl = async (format: string) => {
        try {
            await navigator.clipboard.writeText(feedUrl(format));
            setCopied(format);
            setTimeout(() => setCopied((c) => (c === format ? null : c)), 2000);
            track('feed_url_copied', { format });
        } catch {
            /* clipboard nedostupný — uživatel zkopíruje ručně z pole */
        }
    };

    const saveSettings = async (settings: FeedSettings) => {
        if (!state) return;
        const prev = state.settings;
        setState({ ...state, settings });
        setSaving(true);
        try {
            const res = await apiGet('/api/feeds/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (!res.ok) setState((s) => (s ? { ...s, settings: prev } : s));
            else track('feed_settings_changed', { ebike: settings.ebike, only_available: settings.onlyAvailable });
        } catch {
            setState((s) => (s ? { ...s, settings: prev } : s));
        } finally {
            setSaving(false);
        }
    };

    const regenerate = async () => {
        setRegenerating(true);
        try {
            const res = await apiGet('/api/feeds/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'regenerate' }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                setState((s) => (s ? { ...s, token: data.token } : s));
                setRegenOpen(false);
                track('feed_token_regenerated');
            }
        } finally {
            setRegenerating(false);
        }
    };

    if (!shopUser?.hasAccess) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center">
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Feedy jsou pro partnery</h1>
                <p className="text-sm text-zinc-500">Produktové feedy uvidíte po schválení vašeho účtu.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900">Produktové feedy</h1>
                <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
                    Napojte katalog BULLS přímo na svůj e-shop. Vložte adresu feedu do svého systému —
                    ten si data (produkty, obrázky, dostupnost, MOC i vaši VOC) stáhne sám a může je
                    pravidelně synchronizovat.
                </p>
            </div>

            <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                Adresa feedu obsahuje vaše dealerské ceny (VOC). Chovejte se k ní jako k heslu —
                nikam ji veřejně nevkládejte. Pokud unikne, vygenerujte si níže novou.
            </div>

            {loadError ? (
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{loadError}</div>
            ) : !state ? (
                <div className="bg-white rounded-2xl h-64 animate-pulse" />
            ) : (
                <div className="space-y-4">
                    {/* Nastavení obsahu */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-zinc-900 mb-1">Obsah feedu</h2>
                        <p className="text-xs text-zinc-400 mb-4">
                            Nastavení se uloží k vašemu účtu — adresa feedu se nemění.{saving ? ' Ukládám…' : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-zinc-100 p-1 rounded-xl flex text-sm">
                                {([['all', 'Vše'], ['ebike', 'Jen e-kola'], ['bike', 'Jen kola']] as const).map(([val, label]) => (
                                    <button key={val}
                                        onClick={() => saveSettings({ ...state.settings, ebike: val })}
                                        className={`px-3 py-1.5 font-medium rounded-lg transition-all ${state.settings.ebike === val
                                            ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
                                <button
                                    role="switch"
                                    aria-checked={state.settings.onlyAvailable}
                                    onClick={() => saveSettings({ ...state.settings, onlyAvailable: !state.settings.onlyAvailable })}
                                    className={`relative w-10 h-6 rounded-full transition-colors ${state.settings.onlyAvailable ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${state.settings.onlyAvailable ? 'translate-x-4' : ''}`} />
                                </button>
                                Jen dostupné položky
                            </label>
                        </div>
                    </div>

                    {/* Formáty */}
                    {FORMATS.map(({ format, label, note }) => (
                        <div key={format} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                            <div className="flex items-baseline justify-between gap-3 mb-1">
                                <h2 className="text-sm font-bold text-zinc-900">{label} feed</h2>
                                <a
                                    href={feedUrl(format)}
                                    download={`biketime-feed.${format === 'heureka' ? 'heureka.xml' : format}`}
                                    onClick={() => track('feed_downloaded', { format })}
                                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 whitespace-nowrap"
                                >
                                    ⬇ Stáhnout
                                </a>
                            </div>
                            <p className="text-xs text-zinc-400 mb-3">{note}</p>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={feedUrl(format)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="flex-1 min-w-0 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-600 bg-zinc-50"
                                />
                                <button
                                    onClick={() => copyUrl(format)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${copied === format
                                        ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                                >
                                    {copied === format ? '✓ Zkopírováno' : 'Kopírovat'}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Token */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                        <h2 className="text-sm font-bold text-zinc-900 mb-1">Zabezpečení</h2>
                        <p className="text-xs text-zinc-400 mb-3">
                            {state.lastFetchAt
                                ? `Feed byl naposledy stažen ${new Date(state.lastFetchAt).toLocaleString('cs-CZ')} (${(state.lastFetchFormat || '').toUpperCase()}).`
                                : 'Feed zatím nebyl stažen.'}
                        </p>
                        <button
                            onClick={() => setRegenOpen(true)}
                            className="px-4 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                        >
                            Vygenerovat novou adresu
                        </button>
                    </div>

                    {/* Návod */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 text-sm text-zinc-600">
                        <h2 className="text-sm font-bold text-zinc-900 mb-2">Jak feed napojit</h2>
                        <ol className="list-decimal ml-5 space-y-1 text-sm">
                            <li>Zkopírujte adresu XML feedu výše.</li>
                            <li>Ve svém e-shopu ji vložte do importu produktů (např. Shoptet: Propojení → Import produktů).</li>
                            <li>Nastavte pravidelnou synchronizaci — feed se průběžně obnovuje, doporučujeme stahovat 1× za hodinu až 1× denně.</li>
                            <li>Položky párujte podle <span className="font-mono text-xs">item_id</span> (kód varianty) nebo <span className="font-mono text-xs">ean</span>.</li>
                        </ol>
                        <p className="text-xs text-zinc-400 mt-3">
                            Ceny: <span className="font-mono">price_moc_czk_vat</span> = doporučená MOC s DPH,{' '}
                            <span className="font-mono">price_voc_czk</span> = vaše nákupní cena od Biketime bez DPH
                            (hladina {shopUser?.priceLevel || '—'}).
                        </p>
                    </div>
                </div>
            )}

            {/* Potvrzení regenerace */}
            {regenOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => !regenerating && setRegenOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-zinc-900 mb-1">Vygenerovat novou adresu?</h2>
                        <p className="text-sm text-zinc-500 mb-4">
                            Stávající adresy feedů okamžitě přestanou fungovat. Novou adresu pak musíte
                            vložit všude, kde feed používáte.
                        </p>
                        <button
                            onClick={regenerate}
                            disabled={regenerating}
                            className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                        >
                            {regenerating ? 'Generuji…' : 'Ano, vygenerovat novou'}
                        </button>
                        <button
                            onClick={() => setRegenOpen(false)}
                            disabled={regenerating}
                            className="w-full mt-2 py-2 text-sm text-zinc-500 hover:text-zinc-700"
                        >
                            Zrušit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
