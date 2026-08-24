'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';

interface OrderItem {
    brand: string; model: string; year: number; color: string; size: string;
    frameShape?: string; capacity?: string; variantId: string; quantity: number;
    unitPriceCzk?: number | null;
}

interface Order {
    id: string; status: string; createdAt: string; itemCount: number;
    totalCzk?: number; season?: string; note?: string; items: OrderItem[];
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
    new: { label: 'Nová', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed: { label: 'Potvrzená', cls: 'bg-green-50 text-green-700 border-green-200' },
    shipped: { label: 'Expedovaná', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Zrušená', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};
const PREORDER_STATUS: Record<string, { label: string; cls: string }> = {
    new: { label: 'Nová', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    processing: { label: 'Vyřizuje se', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    done: { label: 'Vyřízená', cls: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { label: 'Zrušená', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

function OrderList({ orders, kind, fetching }: { orders: Order[]; kind: 'order' | 'preorder'; fetching: boolean }) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const statuses = kind === 'order' ? ORDER_STATUS : PREORDER_STATUS;

    if (fetching) return <div className="bg-white rounded-2xl h-32 animate-pulse" />;
    if (orders.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                <p className="text-zinc-400 text-lg mb-3">
                    {kind === 'order' ? 'Zatím nemáte žádné objednávky.' : 'Zatím nemáte žádné předobjednávky.'}
                </p>
                <Link href={kind === 'order' ? '/catalog' : '/predobjednavky'} className="text-primary font-medium hover:underline">
                    {kind === 'order' ? 'Přejít do katalogu →' : 'Přejít na předobjednávky →'}
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {orders.map(order => {
                const status = statuses[order.status] || { label: order.status, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
                const open = expanded === order.id;
                return (
                    <div key={order.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
                        <button onClick={() => setExpanded(open ? null : order.id)} className="w-full p-4 flex items-center gap-4 text-left">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${status.cls}`}>{status.label}</span>
                                    {order.season && <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-zinc-50 text-zinc-500 border-zinc-200">{order.season}</span>}
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
                                {kind === 'order'
                                    ? <div className="font-bold text-zinc-900">{czk(order.totalCzk || 0)}</div>
                                    : <div className="font-bold text-zinc-900">{order.itemCount} ks</div>}
                                {kind === 'order' && <div className="text-xs text-zinc-400">{order.itemCount} ks</div>}
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
                                                {kind === 'order' && (
                                                    <td className="py-2 pr-3 text-right text-zinc-500 whitespace-nowrap">
                                                        {item.unitPriceCzk != null ? `${czk(item.unitPriceCzk)}/ks` : '—'}
                                                    </td>
                                                )}
                                                <td className="py-2 text-right font-semibold whitespace-nowrap">{item.quantity}×</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {order.note && <p className="text-xs text-zinc-500 mt-3"><span className="text-zinc-400">Poznámka:</span> {order.note}</p>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function OrdersPage() {
    const { firebaseUser, shopUser } = useAuth();
    const [tab, setTab] = useState<'order' | 'preorder'>('order');
    const [orders, setOrders] = useState<Order[]>([]);
    const [preorders, setPreorders] = useState<Order[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!firebaseUser || !shopUser?.hasAccess) return;
        let cancelled = false;
        (async () => {
            try {
                const [o, p] = await Promise.all([
                    apiGet('/api/orders', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
                    apiGet('/api/preorders/mine', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
                ]);
                if (cancelled) return;
                setOrders(Array.isArray(o.orders) ? o.orders : []);
                setPreorders(Array.isArray(p.preorders) ? p.preorders : []);
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firebaseUser, shopUser?.hasAccess]);

    if (!shopUser?.hasAccess) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center">
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Objednávky jsou pro partnery</h1>
                <p className="text-sm text-zinc-500">Po schválení vašeho účtu zde uvidíte své objednávky a předobjednávky.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Objednávky</h1>
            <p className="text-sm text-zinc-500 mb-5">Běžné objednávky z katalogu a předobjednávky nových ročníků vedeme zvlášť.</p>

            <div className="bg-zinc-100 p-1 rounded-xl inline-flex text-sm mb-5">
                <button onClick={() => setTab('order')}
                    className={`px-4 py-2 font-medium rounded-lg transition-all ${tab === 'order' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                    Objednávky{!fetching && ` (${orders.length})`}
                </button>
                <button onClick={() => setTab('preorder')}
                    className={`px-4 py-2 font-medium rounded-lg transition-all ${tab === 'preorder' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                    Předobjednávky{!fetching && ` (${preorders.length})`}
                </button>
            </div>

            {tab === 'order'
                ? <OrderList orders={orders} kind="order" fetching={fetching} />
                : <OrderList orders={preorders} kind="preorder" fetching={fetching} />}
        </div>
    );
}
