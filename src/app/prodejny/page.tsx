import { headers } from 'next/headers';
type Shop = {
  id: string;
  name: string;
  address: string;
  website?: string;
};

async function fetchShops(): Promise<Shop[]> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/shops`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.shops ?? []) as Shop[];
}

export const metadata = { title: 'Prodejny | BikeTime' };

function formatDisplayUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, '');
    return `${host}${u.pathname}`.replace(/\/$/, '/');
  } catch (_) {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
}

export default async function ProdejnyPage() {
  const shops = await fetchShops();
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Prodejny – naši partneři</h1>
        {shops.length === 0 ? (
          <div className="text-gray-600">Data se načítají…</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shops.map((s) => (
              <li key={s.id} className="bg-white rounded-lg shadow-sm p-5">
                <div className="font-semibold text-lg mb-1">{s.name}</div>
                <div className="text-gray-700 mb-2">{s.address}</div>
                {s.website ? (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {formatDisplayUrl(s.website)}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}


