'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function ClientZonePage() {
  const { user, loading, signOutUser } = useAuth();

  if (loading) return <div className="p-6">Načítám...</div>;
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="max-w-md mx-auto px-4 py-16">
          <div className="mb-4">Pro vstup do klientské zóny se prosím přihlaste.</div>
          <Link href="/login" className="inline-block bg-black text-white px-4 py-2 rounded">Přejít na přihlášení</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Klientská zóna</h1>
        <div className="text-gray-700 mb-6">Přihlášen/a jako {user.email}</div>
        <button onClick={signOutUser} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">Odhlásit</button>
      </section>
    </main>
  );
}



