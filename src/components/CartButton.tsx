'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';

/** Ikona košíku s počtem kusů — jen pro schválené partnery. */
export default function CartButton({ onClick }: { onClick?: () => void }) {
    const { shopUser } = useAuth();
    const { count } = useCart();

    if (!shopUser?.hasAccess) return null;

    return (
        <Link
            href="/kosik"
            onClick={onClick}
            aria-label={`Košík${count > 0 ? ` (${count} ks)` : ''}`}
            className="relative p-2 text-zinc-700 hover:text-primary transition-colors"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}
