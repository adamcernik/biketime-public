'use client';

import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { signInWithGoogle, loading, user } = useAuth();
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-6">Přihlášení</h1>
        {user ? (
          <div className="text-green-700">Jste přihlášen/a.</div>
        ) : (
          <button
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full bg-black text-white py-3 rounded-md disabled:opacity-50"
          >
            Přihlásit se přes Google
          </button>
        )}
      </section>
    </main>
  );
}



