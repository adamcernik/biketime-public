'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user || !db) {
        setIsAdmin(false);
        return;
      }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const data = snap.data() as { isAdmin?: boolean } | undefined;
      setIsAdmin(Boolean(data?.isAdmin));
    };
    if (!loading) void load();
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center">Načítám…</div>;
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Přístup odepřen</div>
          <div className="text-gray-600 mb-6">Tato sekce je pouze pro administrátory.</div>
          <Link href="/" className="text-blue-600 hover:underline">Zpět na web</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-4 mb-6">
          <Link href="/admin/bikes" className="px-3 py-1.5 rounded bg-white shadow-sm">Kola</Link>
          <Link href="/admin/users" className="px-3 py-1.5 rounded bg-white shadow-sm">Uživatelé</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}




