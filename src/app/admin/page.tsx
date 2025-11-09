export const metadata = { title: 'Admin | BikeTime' };
import Link from 'next/link';

export default function AdminHome() {
  return (
    <div className="grid gap-4">
      <Link href="/admin/bikes" className="block bg-white rounded shadow-sm p-6">
        <div className="text-lg font-semibold">Správa kol</div>
        <div className="text-gray-600">Vyhledávání, zobrazení a editace kol.</div>
      </Link>
      <Link href="/admin/data" className="block bg-white rounded shadow-sm p-6">
        <div className="text-lg font-semibold">Data grid</div>
        <div className="text-gray-600">Tabulka s přehledem (NRLF, model, vel., baterie, rok, ceny).</div>
      </Link>
      <Link href="/admin/users" className="block bg-white rounded shadow-sm p-6">
        <div className="text-lg font-semibold">Uživatelé</div>
        <div className="text-gray-600">Správa administrátorů.</div>
      </Link>
    </div>
  );
}




