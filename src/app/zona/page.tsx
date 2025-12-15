'use client';

import { useAuth } from '@/components/AuthProvider';
import { UserService } from '@/lib/userService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export default function ClientZonePage() {
  const { firebaseUser, shopUser, loading, signOutUser, refreshUserData } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyAddress: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (shopUser) {
      setFormData({
        firstName: shopUser.firstName || '',
        lastName: shopUser.lastName || '',
        companyName: shopUser.companyName || '',
        companyAddress: shopUser.companyAddress || '',
        phone: shopUser.phone || ''
      });
    }
  }, [shopUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUser) return;

    setSaving(true);
    setMessage(null);

    try {
      await UserService.updateUserData(shopUser.uid, formData);
      await refreshUserData();
      setMessage({ type: 'success', text: 'Údaje byly úspěšně uloženy.' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Nastala chyba při ukládání údajů.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
    </div>
  );

  if (!firebaseUser) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <section className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-4">Přístup odepřen</h2>
          <div className="text-zinc-600 mb-6">Pro vstup do klientské zóny se prosím přihlaste.</div>
          <Link href="/login" className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">Přejít na přihlášení</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-16 px-4">
      <section className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Klientská zóna</h1>
          <button
            onClick={async () => {
              await signOutUser();
              router.push('/');
            }}
            className="text-zinc-600 hover:text-zinc-900 text-sm font-medium px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Odhlásit se
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6 pb-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold mb-1">Osobní a firemní údaje</h2>
              <p className="text-sm text-zinc-500">Zde můžete upravit své fakturační a kontaktní údaje.</p>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Jméno</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Příjmení</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Název společnosti (volitelné)</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Adresa / Sídlo firmy</label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-6">
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email (nelze změnit)</label>
                <input
                  type="email"
                  value={firebaseUser.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-zinc-400 mt-1">Pro změnu emailu nás prosím kontaktujte.</p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Ukládám...' : 'Uložit změny'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}



