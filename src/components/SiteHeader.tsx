'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

const navItems: { href: string; label: string }[] = [
  { href: '/catalog', label: 'Katalog' },
  { href: '/prodejny', label: 'Prodejny' },
  { href: '/kola-bulls', label: 'Kola Bulls' },
  { href: '/ke-stazeni', label: 'Ke stažení' },
  { href: '/kontakt', label: 'Kontakt' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, signInWithGoogle, signOutUser } = useAuth();
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40" suppressHydrationWarning>
      <div className="w-full" style={{ backgroundColor: '#9BBC09' }}>
        <div className="max-w-6xl mx-auto px-4 py-1 text-sm text-white flex flex-col gap-1 sm:grid sm:grid-cols-3 sm:items-center">
          <div className="flex items-center gap-4 whitespace-nowrap">
            <a href="mailto:info@biketime.cz" className="hover:underline inline-flex items-center gap-2">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 18V8l8 7 8-7v10H4z"/></svg>
              info@biketime.cz
            </a>
            <a href="tel:+420604263221" className="hover:underline inline-flex items-center gap-2">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.07 22 2 13.93 2 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
              +420 604 263 221
            </a>
          </div>
          <div className="text-center opacity-95">
            Přímý prodej je možný pouze pro naše smluvní odběratele.
          </div>
          <div className="hidden sm:flex items-center justify-end gap-4" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="block relative h-8 w-[140px] logo-link"
          aria-label="Biketime domů"
        >
          <Image
            src="/biketime-logo.png"
            alt="BikeTime"
            fill
            sizes="140px"
            priority
            className="object-contain logo-image"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-gray-700 hover:text-black">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          aria-label="Menu"
          className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded bg-gray-50 ring-1 ring-gray-300"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-800"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}


