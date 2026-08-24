'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { UserRole } from '@/types/User';
import IcoPromptBanner from '@/components/zona/IcoPromptBanner';
import { useZonaNavItems } from '@/components/zona/ZonaNav';

export default function ClientZonePage() {
  const { firebaseUser, shopUser, signOutUser, refreshUserData } = useAuth();
  const router = useRouter();
  const items = useZonaNavItems().filter(i => i.href !== '/zona');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Klientská zóna</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {shopUser?.companyName || shopUser?.displayName || firebaseUser?.email}
            {shopUser?.priceLevel ? ` · cenová hladina ${shopUser.priceLevel}` : ''}
            {shopUser && !shopUser.hasAccess ? ' · účet čeká na schválení' : ''}
          </p>
        </div>
        <button
          onClick={async () => { await signOutUser(); router.push('/'); }}
          className="text-zinc-600 hover:text-zinc-900 text-sm font-medium px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors self-start sm:self-auto"
        >
          Odhlásit se
        </button>
      </div>

      {/* One-time IČO prompt for approved partners registered before the ARES flow. */}
      {shopUser && firebaseUser && shopUser.role === UserRole.SHOP && !shopUser.company?.ico && !shopUser.company?.isForeignCompany && (
        <IcoPromptBanner shopUser={shopUser} firebaseUser={firebaseUser} onDone={refreshUserData} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-zinc-900">{item.label}</h2>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
