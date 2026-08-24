'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { AVAILABILITY_LABELS, type VariantAvailabilityState } from '@/lib/availability';
import { track } from '@/lib/analytics';

interface CenikSize {
    size: string;
    variantId: string;
    ean?: string;
    availability: VariantAvailabilityState;
}

interface CenikRow {
    key: string;
    productId: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    isEbike: boolean;
    preorder?: boolean;
    color: string;
    capacity?: string;
    image?: string;
    moc: number | null;
    voc: number | null;
    availability: VariantAvailabilityState;
    sizes: CenikSize[];
}

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

const AVAIL_BADGE: Record<VariantAvailabilityState, string> = {
    'ours': 'bg-green-100 text-green-700 border-green-200',
    'zeg-stock': 'bg-white text-zinc-600 border-zinc-200',
    'zeg-low': 'bg-white text-amber-700 border-amber-200',
    'zeg-date': 'bg-white text-sky-700 border-sky-200',
    'on-order': 'bg-zinc-100 text-zinc-500 border-zinc-200',
    'none': 'bg-zinc-50 text-zinc-400 border-zinc-100',
};

type SortKey = 'model' | 'moc' | 'voc' | 'year' | 'category';

export default function CenikPage() {
    const { firebaseUser, shopUser } = useAuth();
    const [rows, setRows] = useState<CenikRow[]>([]);
    const [level, setLevel] = useState<string>('');
    const [fetching, setFetching] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Filtry
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [ebike, setEbike] = useState<'all' | 'ebike' | 'non'>('all');
    const [year, setYear] = useState('');
    const [onlyAvailable, setOnlyAvailable] = useState(false);

    // Řazení
    const [sortKey, setSortKey] = useState<SortKey>('category');
    const [sortDir, setSortDir] = useState<1 | -1>(1);

    // Export
    const [exportDialog, setExportDialog] = useState<null | { format: 'xlsx' | 'pdf' }>(null);
    const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await apiGet('/api/cenik', { cache: 'no-store' });
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    setLoadError(data.error || 'Ceník se nepodařilo načíst.');
                } else {
                    setRows(Array.isArray(data.rows) ? data.rows : []);
                    setLevel(data.level || '');
                }
            } catch {
                if (!cancelled) setLoadError('Ceník se nepodařilo načíst.');
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firebaseUser]);

    const categories = useMemo(
        () => Array.from(new Set(rows.map(r => r.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'cs')),
        [rows],
    );
    const years = useMemo(
        () => Array.from(new Set(rows.map(r => r.year).filter(Boolean))).sort((a, b) => b - a),
        [rows],
    );

    const hasActiveFilters = !!search || !!category || ebike !== 'all' || !!year || onlyAvailable;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = rows.filter(r => {
            if (category && r.category !== category) return false;
            if (ebike === 'ebike' && !r.isEbike) return false;
            if (ebike === 'non' && r.isEbike) return false;
            if (year && String(r.year) !== year) return false;
            if (onlyAvailable && r.availability === 'none') return false;
            if (q) {
                const hay = `${r.model} ${r.color} ${r.sizes.map(s => s.variantId).join(' ')}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
        const dir = sortDir;
        result.sort((a, b) => {
            switch (sortKey) {
                case 'model': return dir * (a.model.localeCompare(b.model, 'cs') || b.year - a.year);
                case 'year': return dir * ((a.year - b.year) || a.model.localeCompare(b.model, 'cs'));
                case 'moc': return dir * (((a.moc ?? Infinity) - (b.moc ?? Infinity)));
                case 'voc': return dir * (((a.voc ?? Infinity) - (b.voc ?? Infinity)));
                default: return dir * (a.category.localeCompare(b.category, 'cs') || a.model.localeCompare(b.model, 'cs'));
            }
        });
        return result;
    }, [rows, search, category, ebike, year, onlyAvailable, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1));
        else { setSortKey(key); setSortDir(1); }
    };

    const startExport = (format: 'xlsx' | 'pdf') => {
        setExportError(null);
        setExportScope(hasActiveFilters ? 'filtered' : 'all');
        setExportDialog({ format });
    };

    const runExport = async (format: 'xlsx' | 'pdf', scope: 'filtered' | 'all', withImages: boolean) => {
        setExporting(true);
        setExportError(null);
        try {
            const res = await apiGet('/api/cenik/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    withImages,
                    keys: scope === 'filtered' ? filtered.map(r => r.key) : undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setExportError(data.error || 'Export se nepodařil.');
                return;
            }
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="([^"]+)"/);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = match?.[1] || `cenik.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            track('cenik_exported', { format, scope, with_images: withImages, row_count: scope === 'filtered' ? filtered.length : rows.length });
            setExportDialog(null);
        } catch {
            setExportError('Export se nepodařil. Zkuste to prosím znovu.');
        } finally {
            setExporting(false);
        }
    };

    if (!shopUser?.hasAccess) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center">
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Ceník je pro partnery</h1>
                <p className="text-sm text-zinc-500">Dealerský ceník uvidíte po schválení vašeho účtu.</p>
            </div>
        );
    }

    return (
        <div>
            <div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Dealerský ceník</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Vaše cenová hladina: <span className="font-bold text-zinc-900">{level || shopUser.priceLevel || '—'}</span>
                            {' · '}{filtered.length} položek{hasActiveFilters ? ` (z ${rows.length})` : ''}
                            {' · '}VOC bez DPH, MOC s DPH
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => startExport('xlsx')}
                            disabled={fetching || rows.length === 0}
                            className="px-4 py-2.5 border border-zinc-200 bg-white rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        >
                            ⬇ Export XLS
                        </button>
                        <button
                            onClick={() => startExport('pdf')}
                            disabled={fetching || rows.length === 0}
                            className="px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 disabled:opacity-50"
                        >
                            ⬇ Export PDF
                        </button>
                    </div>
                </div>

                {/* Filtry */}
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Hledat model, barvu, NrLf…"
                        className="flex-1 min-w-[220px] border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white text-zinc-700">
                        <option value="">Všechny kategorie</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="bg-zinc-100 p-1 rounded-xl flex text-sm">
                        {([['ebike', 'E-Bike'], ['non', 'Kolo'], ['all', 'Vše']] as const).map(([val, label]) => (
                            <button key={val} onClick={() => setEbike(val)}
                                className={`px-3 py-1.5 font-medium rounded-lg transition-all ${ebike === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <select value={year} onChange={e => setYear(e.target.value)}
                        className="border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white text-zinc-700">
                        <option value="">Všechny ročníky</option>
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
                        <button
                            role="switch"
                            aria-checked={onlyAvailable}
                            onClick={() => setOnlyAvailable(v => !v)}
                            className={`relative w-10 h-6 rounded-full transition-colors ${onlyAvailable ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyAvailable ? 'translate-x-4' : ''}`} />
                        </button>
                        Jen dostupné
                    </label>
                </div>

                {/* Datagrid */}
                {fetching ? (
                    <div className="bg-white rounded-2xl h-64 animate-pulse" />
                ) : loadError ? (
                    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{loadError}</div>
                ) : (
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto">
                        <table className="w-full text-sm min-w-[840px]">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="text-left text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                                    <th className="p-3 w-16"></th>
                                    <th className="p-3 cursor-pointer select-none hover:text-zinc-600" onClick={() => toggleSort('model')}>
                                        Model {sortKey === 'model' ? (sortDir === 1 ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3">Provedení</th>
                                    <th className="p-3">Velikosti</th>
                                    <th className="p-3 cursor-pointer select-none hover:text-zinc-600" onClick={() => toggleSort('category')}>
                                        Kategorie {sortKey === 'category' ? (sortDir === 1 ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3">Dostupnost</th>
                                    <th className="p-3 text-right cursor-pointer select-none hover:text-zinc-600" onClick={() => toggleSort('moc')}>
                                        MOC s DPH {sortKey === 'moc' ? (sortDir === 1 ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="p-3 text-right cursor-pointer select-none hover:text-zinc-600" onClick={() => toggleSort('voc')}>
                                        VOC bez DPH {sortKey === 'voc' ? (sortDir === 1 ? '↑' : '↓') : ''}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filtered.map(row => (
                                    <tr key={row.key} className="hover:bg-zinc-50/60">
                                        <td className="p-2">
                                            <div className="w-14 h-10 relative bg-zinc-50 rounded-md overflow-hidden">
                                                {row.image && (
                                                    <Image
                                                        src={getOptimizedImageUrl(row.image, 'small', row.brand)}
                                                        alt={row.model}
                                                        fill
                                                        className="object-contain mix-blend-multiply"
                                                        unoptimized
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Link href={`/catalog/${row.productId}`} className="font-bold text-zinc-900 hover:text-primary">
                                                {row.model}
                                            </Link>
                                            <span className="text-zinc-400 ml-1.5 text-xs">{row.year}</span>
                                            {row.preorder && (
                                                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 uppercase align-middle">předobjednávka</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-zinc-600">
                                            {[row.color, row.capacity ? (row.capacity.toLowerCase().includes('wh') ? row.capacity : `${row.capacity} Wh`) : ''].filter(Boolean).join(' · ')}
                                        </td>
                                        <td className="p-3 text-zinc-500 text-xs whitespace-nowrap">{row.sizes.map(s => s.size).join(', ')}</td>
                                        <td className="p-3 text-zinc-500 text-xs">{row.category}</td>
                                        <td className="p-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase whitespace-nowrap ${AVAIL_BADGE[row.availability]}`}>
                                                {AVAILABILITY_LABELS[row.availability]}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-zinc-500 whitespace-nowrap">{row.moc != null ? czk(row.moc) : '—'}</td>
                                        <td className="p-3 text-right font-bold text-zinc-900 whitespace-nowrap">{row.voc != null ? czk(row.voc) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-zinc-400">Filtrům neodpovídá žádná položka.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Export dialog */}
            {exportDialog && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => !exporting && setExportDialog(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-zinc-900 mb-1">
                            Export do {exportDialog.format === 'xlsx' ? 'XLS' : 'PDF'}
                        </h2>
                        <p className="text-sm text-zinc-500 mb-4">Cenová hladina {level}.</p>

                        {hasActiveFilters && (
                            <div className="mb-4">
                                <div className="text-sm font-semibold text-zinc-900 mb-2">Rozsah exportu</div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer text-sm border-zinc-200 has-[:checked]:border-zinc-900">
                                        <input type="radio" name="scope" checked={exportScope === 'filtered'} onChange={() => setExportScope('filtered')} />
                                        Vyfiltrované položky ({filtered.length})
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer text-sm border-zinc-200 has-[:checked]:border-zinc-900">
                                        <input type="radio" name="scope" checked={exportScope === 'all'} onChange={() => setExportScope('all')} />
                                        Kompletní ceník ({rows.length})
                                    </label>
                                </div>
                            </div>
                        )}

                        {exportError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{exportError}</div>
                        )}

                        {exportDialog.format === 'pdf' ? (
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-zinc-900 mb-2">Obrázky v PDF</div>
                                <button
                                    onClick={() => runExport('pdf', exportScope, true)}
                                    disabled={exporting}
                                    className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    {exporting ? 'Generuji…' : 'S obrázky'}
                                </button>
                                <button
                                    onClick={() => runExport('pdf', exportScope, false)}
                                    disabled={exporting}
                                    className="w-full py-3 border border-zinc-200 font-bold text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-50"
                                >
                                    {exporting ? 'Generuji…' : 'Bez obrázků'}
                                </button>
                                <p className="text-xs text-zinc-400">Export s obrázky může trvat déle (stahují se fotografie produktů).</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => runExport('xlsx', exportScope, false)}
                                disabled={exporting}
                                className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {exporting ? 'Generuji…' : 'Exportovat'}
                            </button>
                        )}

                        <button
                            onClick={() => setExportDialog(null)}
                            disabled={exporting}
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
