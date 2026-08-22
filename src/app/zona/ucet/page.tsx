'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { UserService } from '@/lib/userService';
import { apiGet } from '@/lib/clientApi';

export default function AccountSettingsPage() {
  const { firebaseUser, shopUser, refreshUserData, resetPassword, signOutUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ firstName: '', lastName: '', companyName: '', companyAddress: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteState, setDeleteState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (shopUser) {
      setFormData({
        firstName: shopUser.firstName || '',
        lastName: shopUser.lastName || '',
        companyName: shopUser.companyName || '',
        companyAddress: shopUser.companyAddress || '',
        phone: shopUser.phone || '',
      });
    }
  }, [shopUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const usesPassword = !!firebaseUser?.providerData?.some(p => p.providerId === 'password');
  const usesGoogle = !!firebaseUser?.providerData?.some(p => p.providerId === 'google.com');

  const sendReset = async () => {
    if (!firebaseUser?.email) return;
    setResetState('sending');
    try {
      await resetPassword(firebaseUser.email);
      setResetState('sent');
    } catch {
      setResetState('error');
    }
  };

  const sendDeleteRequest = async () => {
    setDeleteState('sending');
    try {
      const res = await apiGet('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      setDeleteState(res.ok ? 'sent' : 'error');
    } catch {
      setDeleteState('error');
    }
  };

  const inputCls = 'w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Nastavení účtu</h1>
        <p className="text-sm text-zinc-500">Kontaktní a firemní údaje, přihlašování a správa účtu.</p>
      </div>

      {/* Kontaktní údaje */}
      <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Osobní a firemní údaje</h2>
        <p className="text-sm text-zinc-500 mb-5">Fakturační a kontaktní údaje, které používáme u objednávek a faktur.</p>

        {message && (
          <div className={`mb-5 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Jméno</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Příjmení</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Název společnosti</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Adresa / Sídlo firmy</label>
            <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Telefon</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
          </div>
          {shopUser?.company?.ico && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-zinc-100">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">IČO</label>
                <input type="text" value={shopUser.company.ico} disabled className="w-full px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">DIČ</label>
                <input type="text" value={shopUser.company.vatId || '—'} disabled className="w-full px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed" />
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-zinc-100">
            <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail (nelze změnit)</label>
            <input type="email" value={firebaseUser?.email || ''} disabled className="w-full px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-lg cursor-not-allowed" />
            <p className="text-xs text-zinc-400 mt-1">Pro změnu e-mailu nás prosím kontaktujte.</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
              {saving ? 'Ukládám…' : 'Uložit změny'}
            </button>
          </div>
        </form>
      </section>

      {/* Přihlašování */}
      <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Přihlašování</h2>
        {usesPassword ? (
          <>
            <p className="text-sm text-zinc-500 mb-4">
              Přihlašujete se e-mailem a heslem. Pro změnu hesla vám pošleme odkaz na {firebaseUser?.email}.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={sendReset}
                disabled={resetState === 'sending' || resetState === 'sent'}
                className="px-5 py-2.5 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {resetState === 'sending' ? 'Odesílám…' : resetState === 'sent' ? 'Odkaz odeslán ✓' : 'Poslat odkaz pro změnu hesla'}
              </button>
              {resetState === 'error' && <span className="text-sm text-red-600">Odeslání se nepodařilo, zkuste to znovu.</span>}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500">
            Přihlašujete se přes {usesGoogle ? 'účet Google' : 'externího poskytovatele'} — heslo spravujete tam, zde se nic nastavovat nemusí.
          </p>
        )}
      </section>

      {/* Zrušení účtu */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Zrušení účtu</h2>
        {shopUser?.deletionRequestedAt || deleteState === 'sent' ? (
          <p className="text-sm text-zinc-500">
            Žádost o zrušení účtu jsme přijali a vyřídíme ji. Pokud jste si to rozmysleli, napište nám na info@biketime.cz.
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-4">
              Kvůli vazbám na objednávky a faktury účet nemažeme okamžitě — odešlete žádost a my ji vyřídíme.
              Do té doby zůstane účet funkční.
            </p>
            {!deleteOpen ? (
              <button onClick={() => setDeleteOpen(true)} className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50">
                Požádat o zrušení účtu
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value.slice(0, 1000))}
                  rows={3}
                  placeholder="Důvod (nepovinné)"
                  className="w-full border border-zinc-200 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary"
                />
                {deleteState === 'error' && <p className="text-sm text-red-600">Žádost se nepodařilo odeslat. Zkuste to znovu.</p>}
                <div className="flex gap-3">
                  <button onClick={sendDeleteRequest} disabled={deleteState === 'sending'} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                    {deleteState === 'sending' ? 'Odesílám…' : 'Odeslat žádost o zrušení'}
                  </button>
                  <button onClick={() => setDeleteOpen(false)} className="px-5 py-2.5 text-sm text-zinc-500 hover:text-zinc-700">Zpět</button>
                </div>
              </div>
            )}
          </>
        )}
        <div className="mt-5 pt-5 border-t border-zinc-100">
          <button
            onClick={async () => { await signOutUser(); router.push('/'); }}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Odhlásit se z tohoto zařízení
          </button>
        </div>
      </section>
    </div>
  );
}
