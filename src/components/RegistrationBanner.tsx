'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

/**
 * Site-wide nudge for signed-in users who haven't finished onboarding:
 *  - signed in but no company details yet → finish the registration form
 *  - registered but not yet approved → waiting for approval
 * Hidden on the pages that already handle this (/registrace, /login).
 */
export default function RegistrationBanner() {
  const { shopUser } = useAuth();
  const pathname = usePathname();

  if (!shopUser) return null;
  if (pathname?.startsWith('/registrace') || pathname?.startsWith('/login')) return null;
  if (shopUser.hasAccess) return null; // fully approved → nothing to show

  if (!shopUser.companyName) {
    return (
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm text-amber-900">
          <span>Dokončete registraci a získáte přístup k velkoobchodním (B2B) cenám.</span>
          <Link href="/registrace" className="font-bold underline underline-offset-2 hover:no-underline">
            Dokončit registraci →
          </Link>
        </div>
      </div>
    );
  }

  // Company details filled, awaiting admin approval.
  return (
    <div className="border-b border-blue-200 bg-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-sm text-blue-900">
        Vaše registrace byla odeslána a <strong>čeká na schválení</strong>. Po schválení vám přijde e-mail a&nbsp;získáte přístup k&nbsp;B2B cenám.
      </div>
    </div>
  );
}
