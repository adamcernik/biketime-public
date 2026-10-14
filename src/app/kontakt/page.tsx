import KontaktMap from '@/components/KontaktMap';

export const metadata = {
  title: 'Kontakt | BikeTime',
};

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Kontakt</h1>

        {/* Hlavní: showroom a servis (zároveň kontaktní / korespondenční adresa) */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 shrink-0 text-primary">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Showroom a servis</h2>
            </div>

            <div className="space-y-2 text-gray-700">
              <p className="text-lg font-medium">Nekvasilova 31, 186 00 Praha 8</p>
              <p className="text-sm text-gray-500">metro: Invalidovna</p>
              <p className="pt-2">
                <a href="mailto:info@biketime.cz" className="font-medium text-primary hover:underline">info@biketime.cz</a>
              </p>
              <p>
                tel: <a href="tel:+420604263221" className="font-medium text-primary hover:underline">+420 604 263 221</a>
              </p>
              <p className="pt-2 text-xs uppercase tracking-widest text-gray-400">
                Kontaktní a korespondenční adresa
              </p>
              <p className="pt-1">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=50.097614,14.467022"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Navigovat →
                </a>
              </p>
            </div>
          </div>

          <KontaktMap className="h-56 md:h-64 w-full" />
        </div>

        {/* Ostatní adresy — upozaděné */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-600">
          <div className="rounded-lg border border-gray-200 p-5">
            <div className="uppercase tracking-widest text-xs text-gray-400 font-semibold mb-2">Sídlo firmy</div>
            <p>BIKETIME s.r.o.</p>
            <p>K dolům 1924/42, 143 00 Praha 4</p>
            <p>IČO: 03269787</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <div className="uppercase tracking-widest text-xs text-gray-400 font-semibold mb-2">Sklad</div>
            <p>Lorenc Logistic s.r.o.</p>
            <p>Tovární 1162, 410 02 Lovosice</p>
          </div>
        </div>
      </section>
    </main>
  );
}
