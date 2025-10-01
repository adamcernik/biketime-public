import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/biketime-logo.png" alt="BikeTime" className="h-7 w-auto" />
          </Link>
          <Link href="/catalog" className="text-blue-600 hover:underline">Katalog</Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Veřejný katalog kol</h1>
        <p className="text-gray-700 mb-6">Prohlédněte si kompletní nabídku importovaných kol.</p>
        <Link href="/catalog" className="inline-block bg-black text-white px-6 py-3 rounded-md">Přejít do katalogu</Link>
      </section>
    </main>
  );
}
