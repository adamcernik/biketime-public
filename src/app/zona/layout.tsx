'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ZonaNav from '@/components/zona/ZonaNav';

// Společný rám klientské zóny: přihlašovací brána + levé menu (desktop) /
// záložky (mobil). Stránky pod /zona renderují jen svůj obsah.
// Výjimka: /zona/bosch-abs je veřejný článek bez zóny.

const PUBLIC_PATHS = ['/zona/bosch-abs'];

export default function ZonaLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname() || '';
    const { firebaseUser, loading } = useAuth();

    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return <>{children}</>;
    }

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
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Klientská zóna</h1>
                    <p className="text-sm text-zinc-500 mb-6">Pro vstup do klientské zóny se prosím přihlaste.</p>
                    <Link href="/login" className="inline-block px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl">
                        Přihlásit se
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            <div className="container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <ZonaNav />
                    <div className="flex-1 min-w-0">{children}</div>
                </div>
            </div>
        </main>
    );
}
