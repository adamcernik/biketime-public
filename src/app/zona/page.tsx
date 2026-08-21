'use client';

import { useAuth } from '@/components/AuthProvider';
import { UserService } from '@/lib/userService';
import { isValidIco, normalizeIco } from '@/lib/validation/ico';
import type { CompanyData } from '@/lib/ares';
import { UserRole, type ShopUser } from '@/types/User';
import type { User as FirebaseUser } from 'firebase/auth';
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

        {/* One-time IČO prompt for approved partners registered before the ARES
            flow existed. Not dismissable, but doesn't block anything (spec §6.2).
            Disappears once company.ico or isForeignCompany is set. */}
        {shopUser && shopUser.role === UserRole.SHOP && !shopUser.company?.ico && !shopUser.company?.isForeignCompany && (
          <IcoPromptBanner shopUser={shopUser} firebaseUser={firebaseUser} onDone={refreshUserData} />
        )}

        {shopUser?.hasAccess && (
          <Link
            href="/zona/cenik"
            className="mb-6 flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h4m-9 5V4a1 1 0 011-1h10.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V20a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-zinc-900">Dealerský ceník</h2>
                <p className="text-sm text-zinc-500">Kompletní ceník pro vaši cenovou hladinu, export do XLS a PDF</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        <Link
          href="/zona/faktury"
          className="mb-6 flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Moje faktury</h2>
              <p className="text-sm text-zinc-500">Zobrazení a stažení faktur vystavených na vaši firmu</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

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

// Self-service IČO fill-in: lookup via /api/company-lookup (authenticated, so
// the duplicity check excludes this user's own record), then persist the
// company block. Legacy flat fields are only mirrored when empty.
function IcoPromptBanner({
  shopUser,
  firebaseUser,
  onDone,
}: {
  shopUser: ShopUser;
  firebaseUser: FirebaseUser;
  onDone: () => Promise<void>;
}) {
  const [ico, setIco] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = isValidIco(normalizeIco(ico)) && !busy;

  const handleFill = async () => {
    const normalized = normalizeIco(ico);
    if (!isValidIco(normalized)) {
      setErr('IČO musí mít 8 číslic a platný kontrolní součet.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/company-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ico: normalized }),
      });
      const json = await res.json();

      if (!json.ok) {
        const messages: Record<string, string> = {
          INVALID_ICO: 'Neplatné IČO. Zkontrolujte, že má 8 číslic.',
          NOT_FOUND: 'Firmu jsme v ARES nenašli. Zkontrolujte IČO, nebo označte firmu jako zahraniční.',
          COMPANY_TERMINATED: 'Firma s tímto IČO je v ARES vedena jako zaniklá. Kontaktujte prosím podporu.',
          DUPLICATE: 'Toto IČO už je u nás registrováno u jiného účtu. Kontaktujte prosím podporu.',
          RATE_LIMITED: 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.',
          ARES_UNAVAILABLE: 'Registr ARES je momentálně nedostupný. Zkuste to prosím později.',
        };
        setErr(messages[json.error] ?? 'Načtení z ARES se nepodařilo. Zkuste to prosím později.');
        return;
      }

      const d = json.data as CompanyData;
      await UserService.updateCompanyData(
        shopUser.uid,
        {
          ico: d.ico,
          vatId: d.vatId,
          legalName: d.legalName,
          street: d.street,
          city: d.city,
          zip: d.zip,
          country: d.country,
          legalFormCode: d.legalFormCode,
          foundedAt: d.foundedAt,
          isVatPayer: d.isVatPayer,
          aresVerifiedAt: new Date().toISOString(),
          isForeignCompany: false,
        },
        {
          // Mirror into legacy fields only when the partner has them empty —
          // never overwrite their own wording without consent.
          companyName: shopUser.companyName ? undefined : d.legalName,
          companyAddress: shopUser.companyAddress ? undefined : [d.street, `${d.zip} ${d.city}`.trim()].filter(Boolean).join('\n'),
        },
      );
      await onDone(); // refresh → banner unmounts (company.ico now set)
    } catch (e) {
      console.error('IČO fill-in failed:', e);
      setErr('Uložení se nepodařilo. Zkuste to prosím znovu.');
    } finally {
      setBusy(false);
    }
  };

  const markForeign = async () => {
    setBusy(true);
    setErr(null);
    try {
      await UserService.updateCompanyData(shopUser.uid, { isForeignCompany: true });
      await onDone(); // banner unmounts permanently
    } catch (e) {
      console.error('Mark foreign failed:', e);
      setErr('Uložení se nepodařilo. Zkuste to prosím znovu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Doplňte prosím IČO své firmy</h3>
          <p className="mt-1 text-sm text-amber-800">
            Potřebujeme ho pro fakturaci — zadejte IČO a zbytek údajů dohledáme v registru ARES za vás. Trvá to 30 sekund.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              value={ico}
              onChange={e => { setIco(e.target.value); setErr(null); }}
              placeholder="27604977"
              className="flex-1 rounded-lg border border-amber-300 bg-white px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary sm:max-w-[220px]"
            />
            <button
              type="button"
              onClick={handleFill}
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-5 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Načítám…' : 'Doplnit z ARES'}
            </button>
          </div>

          {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

          <button
            type="button"
            onClick={markForeign}
            disabled={busy}
            className="mt-3 text-xs text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
          >
            Jsme zahraniční firma / nemáme IČO
          </button>
        </div>
      </div>
    </div>
  );
}



