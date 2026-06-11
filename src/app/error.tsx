'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Něco se pokazilo</h1>
        <p className="text-gray-600 mb-6">
          Omlouváme se, při načítání stránky došlo k chybě. Zkuste to prosím znovu.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
    </main>
  );
}
