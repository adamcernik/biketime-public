import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 mb-2">404</p>
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Stránka nenalezena</h1>
        <p className="text-gray-600 mb-6">
          Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Zpět na úvod
          </Link>
          <Link
            href="/catalog"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Prohlédnout katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
