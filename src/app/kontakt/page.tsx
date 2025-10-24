export const metadata = {
  title: 'Kontakt | BikeTime',
};

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Kontakt</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kontakt */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 text-[#9BBC09]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 18V8l8 7 8-7v10H4z" />
              </svg>
            </div>
            <div className="uppercase tracking-widest text-gray-500 font-semibold mb-2">Kontakt</div>
            <div className="space-y-2 text-gray-700">
              <p>Bořanovická 13, 182 00 Praha 8</p>
              <p>
                <a href="mailto:info@biketime.cz" className="text-blue-600 hover:underline">info@biketime.cz</a>
              </p>
              <p>
                tel: <a href="tel:+420604263221" className="text-blue-600 hover:underline">+420 604 263 221</a>
              </p>
            </div>
          </div>

          {/* Sídlo firmy */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 text-[#9BBC09]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <div className="uppercase tracking-widest text-gray-500 font-semibold mb-2">Sídlo firmy</div>
            <div className="space-y-2 text-gray-700">
              <p>BIKETIME s.r.o.</p>
              <p>K dolům 1924/42, 143 00 Praha 4</p>
              <p>IČO: 03269787</p>
            </div>
          </div>

          {/* Sklad */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 text-[#9BBC09]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
                <path d="M3 3h18v6H3V3zm0 8h18v10H3V11zm2 2v6h14v-6H5z" />
              </svg>
            </div>
            <div className="uppercase tracking-widest text-gray-500 font-semibold mb-2">Sklad</div>
            <div className="space-y-2 text-gray-700">
              <p>Lorenc Logistic s.r.o.</p>
              <p>Tovární 1162, 410 02 Lovosice</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


