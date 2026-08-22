'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';

interface InvoiceRow {
  id: string;
  cislo: string;
  castka: number | null;
  datum: string | null;
  splatnost: string | null;
  fileName: string;
  size: number | null;
}

const czk = (n: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n)
    : '—';
const dateStr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('cs-CZ') : '—');

export default function InvoicesPage() {
  const { firebaseUser } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet('/api/invoices');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInvoices(data.invoices ?? []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Faktury se nepodařilo načíst. Zkuste to prosím znovu.');
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    if (firebaseUser) load();
  }, [firebaseUser, load]);

  const open = async (inv: InvoiceRow, mode: 'view' | 'download') => {
    setBusyId(inv.id);
    try {
      const res = await apiGet(`/api/invoices/${inv.id}/download${mode === 'download' ? '?mode=download' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      if (mode === 'view') {
        window.open(url, '_blank', 'noopener');
      } else {
        // Stažení: navigace na podepsaný odkaz s attachment dispozicí.
        const a = document.createElement('a');
        a.href = url;
        a.download = inv.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error(e);
      setError('Soubor se nepodařilo otevřít. Zkuste to prosím znovu.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.42 15.17l-5.1 5.1a2.12 2.12 0 01-3-3l5.1-5.1M14.8 6.2l3 3M9 11l7.3-7.3a2.12 2.12 0 013 3L12 14M13 20h8" />
          </svg>
        </span>
        <div>
          <h2 className="font-semibold text-amber-900">Faktury jsou ve výstavbě</h2>
          <p className="mt-1 text-sm text-amber-800">
            Na této stránce brzy najdete všechny faktury vystavené na vaši firmu ke stažení. Funkce bude zprovozněna v nejbližší době — do té doby vám faktury posíláme e-mailem jako dosud.
          </p>
        </div>
      </div>
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Moje faktury</h1>
            <p className="text-sm text-zinc-500 mt-1">Faktury vystavené na vaši firmu — zobrazení i stažení v PDF.</p>
          </div>
          <Link
            href="/zona"
            className="text-zinc-600 hover:text-zinc-900 text-sm font-medium px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            ← Klientská zóna
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {invoices === null ? (
            <div className="p-12 text-center text-zinc-400">Načítám faktury…</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              Zatím tu žádné faktury nemáte. Jakmile vám nějakou vystavíme, objeví se zde.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Číslo faktury</th>
                    <th className="px-5 py-3 text-left font-medium">Vystaveno</th>
                    <th className="px-5 py-3 text-left font-medium">Splatnost</th>
                    <th className="px-5 py-3 text-right font-medium">Částka</th>
                    <th className="px-5 py-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/60">
                      <td className="px-5 py-3 font-medium text-zinc-900">{inv.cislo}</td>
                      <td className="px-5 py-3 text-zinc-600">{dateStr(inv.datum)}</td>
                      <td className="px-5 py-3 text-zinc-600">{dateStr(inv.splatnost)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-zinc-900">{czk(inv.castka)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => open(inv, 'view')}
                          disabled={busyId === inv.id}
                          className="text-primary hover:underline font-medium disabled:opacity-50 mr-4"
                        >
                          Zobrazit
                        </button>
                        <button
                          onClick={() => open(inv, 'download')}
                          disabled={busyId === inv.id}
                          className="text-primary hover:underline font-medium disabled:opacity-50"
                        >
                          Stáhnout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-400 mt-4">
          Odkazy na PDF jsou z bezpečnostních důvodů časově omezené — otevírají se vždy čerstvé po kliknutí.
        </p>
      </section>
    </div>
  );
}
