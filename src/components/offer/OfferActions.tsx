'use client';

import { PrinterIcon, DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface OfferActionsProps {
  /** Offer token — used to build the download URLs. */
  token: string;
}

/**
 * Screen-only action bar for an offer: download a real PDF (server-generated,
 * with images), download Excel, or print. Hidden when printing via `no-print`.
 */
export default function OfferActions({ token }: OfferActionsProps) {
  const id = encodeURIComponent(token);
  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <a
        href={`/api/offers/${id}/pdf`}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-red-700"
      >
        <DocumentArrowDownIcon className="h-5 w-5" />
        Stáhnout PDF
      </a>
      <a
        href={`/api/offers/${id}/excel`}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
      >
        <TableCellsIcon className="h-5 w-5" />
        Stáhnout Excel
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
      >
        <PrinterIcon className="h-5 w-5" />
        Tisk
      </button>
    </div>
  );
}
