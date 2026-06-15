'use client';

import { ArrowDownTrayIcon, PrinterIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface OfferActionsProps {
  /** Offer token — used to build the Excel download URL. */
  token: string;
}

/**
 * Screen-only action bar for an offer: print/save as PDF (renders the styled
 * page with images via the browser's print dialog) and download as Excel.
 * Hidden when printing via the `no-print` class.
 */
export default function OfferActions({ token }: OfferActionsProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-red-700"
      >
        <PrinterIcon className="h-5 w-5" />
        Stáhnout PDF / Tisk
      </button>
      <a
        href={`/api/offers/${encodeURIComponent(token)}/excel`}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
      >
        <TableCellsIcon className="h-5 w-5" />
        Stáhnout Excel
      </a>
      <span className="hidden items-center gap-1.5 text-xs text-zinc-400 sm:inline-flex">
        <ArrowDownTrayIcon className="h-4 w-4" />
        V dialogu tisku zvolte „Uložit jako PDF“
      </span>
    </div>
  );
}
