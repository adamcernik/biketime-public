'use client';
// Re-trigger build 3

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import logoImage from '@/assets/biketime-logo.png';

const navItems: { href: string; label: string }[] = [
  { href: '/catalog', label: 'Katalog kol' },
  { href: '/prislusenstvi', label: 'Příslušenství' },
  { href: '/prodejny', label: 'Prodejny' },
  { href: '/kola-bulls', label: 'Kola Bulls' },

  { href: '/kontakt', label: 'Kontakt' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      {/* Top Bar */}
      <div className="w-full bg-zinc-900 text-zinc-300 text-xs py-2">
        <div className="container-custom flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <a href="mailto:info@biketime.cz" className="hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              info@biketime.cz
            </a>
            <a href="tel:+420604263221" className="hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +420 604 263 221
            </a>
          </div>
          <div className="hidden sm:block">
            <Link href="/prodejny" className="hover:text-white transition-colors">
              Prodej možný v prodejnách uvedených zde
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container-custom py-4 flex items-center justify-between">
        <Link href="/" className="relative h-10 w-[160px] logo-link z-50">
          <Image
            src={logoImage}
            alt="Biketime Logo"
            fill
            sizes="160px"
            priority
            className="object-contain logo-image"
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 hover:text-primary transition-colors uppercase tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-50 p-2 text-zinc-800"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Overlay */}
        <div
          className={`fixed inset-0 bg-white z-40 flex flex-col justify-center items-center gap-8 transition-all duration-300 md:hidden ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
            }`}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-2xl font-semibold text-zinc-800 hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
