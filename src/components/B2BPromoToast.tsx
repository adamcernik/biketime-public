'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

// Non-blocking B2B promo toast for anonymous visitors. Slides in bottom-right
// after a delay, auto-dismisses after a while (with a depleting countdown bar),
// and once dismissed (manually or automatically) never shows again on this
// browser. Hidden for signed-in users and on the auth pages.
const APPEAR_AFTER_MS = 10000; // wait before showing — don't pester on arrival
const VISIBLE_MS = 11000;      // how long it stays (matches the countdown bar)
const STORAGE_KEY = 'b2bPromoDismissed';

export default function B2BPromoToast() {
  const { firebaseUser, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false); // present in the DOM
  const [shown, setShown] = useState(false);     // slid in (drives the transition)
  const [shrink, setShrink] = useState(false);   // countdown bar 100% → 0%
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setShown(false);
    setTimeout(() => setMounted(false), 300); // after slide-out
  }, []);

  const excluded = pathname?.startsWith('/registrace') || pathname?.startsWith('/login');

  useEffect(() => {
    if (loading || firebaseUser || excluded) return;          // signed-in / auth page
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;            // already dismissed

    const appear = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => { setShown(true); setShrink(true); });
      dismissTimer.current = setTimeout(dismiss, VISIBLE_MS);
    }, APPEAR_AFTER_MS);

    return () => clearTimeout(appear);
  }, [loading, firebaseUser, excluded, dismiss]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:w-96" role="dialog" aria-label="Staňte se B2B partnerem">
      <div className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
        {/* Countdown bar — depletes over VISIBLE_MS, then the toast auto-dismisses. */}
        <div className="h-1 w-full bg-zinc-100">
          <div className="h-full bg-primary" style={{ width: shrink ? '0%' : '100%', transition: `width ${VISIBLE_MS}ms linear` }} />
        </div>

        <button onClick={dismiss} aria-label="Zavřít" className="absolute right-3 top-3 text-zinc-400 transition hover:text-zinc-700">✕</button>

        <div className="p-5">
          <h3 className="pr-6 text-base font-bold text-zinc-900">Jste prodejce kol? Staňte se partnerem.</h3>
          <p className="mt-1.5 text-sm text-zinc-600">
            Získejte přístup k&nbsp;velkoobchodním (B2B) cenám, kompletnímu katalogu kol BULLS
            a&nbsp;podpoře pro autorizované prodejce.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Link href="/registrace" onClick={dismiss} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
              Registrovat prodejnu
            </Link>
            <button onClick={dismiss} className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800">Teď ne</button>
          </div>
          <Link href="/login" onClick={dismiss} className="mt-3 inline-block text-xs text-zinc-400 transition hover:text-zinc-700">
            Už máte účet? Přihlásit se
          </Link>
        </div>
      </div>
    </div>
  );
}
