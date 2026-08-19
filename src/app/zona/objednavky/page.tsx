'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';

interface OrderItem {
    brand: string;
    model: string;
    year: number;
    color: string;
    size: string;
    frameShape?: string;
    capacity?: string;
    variantId: string;
    quantity: number;
    unitPriceCzk: number | null;
}

interface Order {
    id: string;
    status: string;
    createdAt: string;
    itemCount: number;
    totalCzk: number;
    note?: string;
    items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    new: { label: 'Nová', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed: { label: 'Potvrzená', cls: 'bg-green-50 text-green-700 border-green-200' },
    shipped: { label: 'Expedovaná', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Zrušená', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

export default function OrdersPage() {
    const { firebaseUser, loading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [fetching, setFetching] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await apiGet('/api/orders', { cache: 'no-store' });
                const data = await res.json();
                if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
            } catch {
                if (!cancelled) setOrders([]);
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firebaseUser]);

    if (loading) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </main>
        );
    }

    if (!firebaseUser) {
        return (
            <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center max-w-md">
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Přístup odepřen</h1>
                    <p className="text-sm text-zinc-500 mb-6">Pro zobrazení objednávek se přihlaste.</p>
                    <Link href="/login" className="inline-block px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl">
                        Přihlásit se
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            <div className="container-custom py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900">Moje objednávky</h1>
                    <Link href="/catalog" className="text-sm text-primary font-medium hover:underline">
                        Do katalogu →
                    </Link>
                </div>

                {fetching ? (
                    <div className="bg-white rounded-2xl h-32 animate-pulse" />
                ) : orders.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-zinc-200">
                        <p className="text-zinc-400 text-lg">Zatím nemáte žádné objednávky.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => {
                            const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
                            const open = expanded === order.id;
                            return (
                                <div key={order.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                    <button
                                        onClick={() => setExpanded(open ? null : order.id)}
                                        className="w-full p-4 flex items-center gap-4 text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${status.cls}`}>{status.label}</span>
                                                <span className="text-xs text-zinc-400">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-zinc-900 mt-1 truncate">
                                                {order.items?.slice(0, 3).map(i => i.model).join(', ')}{(order.items?.length || 0) > 3 ? '…' : ''}
                                            </div>
                                            <div className="text-[11px] text-zinc-400 font-mono">č. {order.id}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-zinc-900">{czk(order.totalCzk || 0)}</div>
                                            <div className="text-xs text-zinc-400">{order.itemCount} ks</div>
                                        </div>
                                        <svg className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {open && (
                                        <div className="px-4 pb-4 border-t border-zinc-100 pt-3">
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-zinc-50">
                                                    {order.items?.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-2 pr-3">
                                                                <div className="font-medium text-zinc-900">{item.brand} {item.model} ({item.year})</div>
                                                                <div className="text-xs text-zinc-500">
                                                                    {[item.color, item.frameShape, item.capacity, item.size ? `vel. ${item.size}` : ''].filter(Boolean).join(' · ')}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 pr-3 text-right text-zinc-500 whitespace-nowrap">
                                                                {item.unitPriceCzk != null ? `${czk(item.unitPriceCzk)}/ks` : '—'}
                                                            </td>
                                                            <td className="py-2 text-right font-semibold whitespace-nowrap">{item.quantity}×</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {order.note && (
                                                <p className="text-xs text-zinc-500 mt-3"><span className="text-zinc-400">Poznámka:</span> {order.note}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
