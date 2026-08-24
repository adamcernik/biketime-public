'use client';

import { UserService } from '@/lib/userService';
import { isValidIco, normalizeIco } from '@/lib/validation/ico';
import type { CompanyData } from '@/lib/ares';
import type { ShopUser } from '@/types/User';
import type { User as FirebaseUser } from 'firebase/auth';
import React, { useState } from 'react';

// Self-service IČO fill-in: lookup via /api/company-lookup (authenticated, so
// the duplicity check excludes this user's own record), then persist the
// company block. Legacy flat fields are only mirrored when empty.
export default function IcoPromptBanner({
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



