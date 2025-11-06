export const metadata = { title: 'Admin | BikeTime' };

export default function AdminHome() {
  return (
    <div className="grid gap-4">
      <a href="/admin/bikes" className="block bg-white rounded shadow-sm p-6">
        <div className="text-lg font-semibold">Správa kol</div>
        <div className="text-gray-600">Vyhledávání, zobrazení a editace kol.</div>
      </a>
      <a href="/admin/users" className="block bg-white rounded shadow-sm p-6">
        <div className="text-lg font-semibold">Uživatelé</div>
        <div className="text-gray-600">Správa administrátorů.</div>
      </a>
    </div>
  );
}




