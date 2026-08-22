'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

// Navigace klientské zóny — vlevo na desktopu (WordPress styl), na mobilu
// vodorovné záložky. Zdroj pravdy pro položky sdílí i horní uživatelské menu.

export interface ZonaNavItem {
    href: string;
    label: string;
    description: string;
    icon: string; // SVG path d
    partnerOnly?: boolean;
}

export const ZONA_NAV: ZonaNavItem[] = [
    { href: '/zona', label: 'Přehled', description: 'Rozcestník klientské zóny', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10' },
    { href: '/zona/ucet', label: 'Nastavení účtu', description: 'Kontaktní údaje, heslo, zrušení účtu', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { href: '/zona/katalog', label: 'Nastavení katalogu', description: 'Zobrazení velkoobchodních cen', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', partnerOnly: true },
    { href: '/zona/cenik', label: 'Ceník', description: 'Dealerský ceník, export XLS/PDF', icon: 'M9 7h6m-6 4h6m-6 4h4m-9 5V4a1 1 0 011-1h10.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V20a1 1 0 01-1 1H6a1 1 0 01-1-1z', partnerOnly: true },
    { href: '/zona/faktury', label: 'Faktury', description: 'Faktury vystavené na vaši firmu', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/zona/objednavky', label: 'Objednávky', description: 'Objednávky a předobjednávky', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', partnerOnly: true },
];

export function useZonaNavItems(): ZonaNavItem[] {
    const { shopUser } = useAuth();
    return ZONA_NAV.filter(i => !i.partnerOnly || shopUser?.hasAccess);
}

export function isZonaItemActive(pathname: string, href: string): boolean {
    return href === '/zona' ? pathname === '/zona' : pathname.startsWith(href);
}

export default function ZonaNav() {
    const pathname = usePathname() || '';
    const items = useZonaNavItems();

    return (
        <>
            {/* Desktop: levý sloupec */}
            <nav className="hidden lg:block w-60 shrink-0">
                <div className="sticky top-24 bg-white rounded-2xl border border-zinc-100 shadow-sm p-2">
                    {items.map(item => {
                        const active = isZonaItemActive(pathname, item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                            >
                                <svg className={`w-4.5 h-4.5 w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Mobil/tablet: vodorovné záložky */}
            <nav className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto">
                <div className="flex gap-2 w-max">
                    {items.map(item => {
                        const active = isZonaItemActive(pathname, item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${active
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
