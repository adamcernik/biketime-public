'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';

type UserRow = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  isAdmin?: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!db) return;
      setLoading(true);
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d)=> ({ uid: d.id, ...(d.data() as any) })));
      setLoading(false);
    };
    void load();
  }, []);

  const setAdmin = async (uid: string, value: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', uid), { isAdmin: value });
    setUsers((prev)=> prev.map((u)=> u.uid===uid ? { ...u, isAdmin: value } : u));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Uživatelé</h1>
      {loading ? (
        <div className="text-gray-600">Načítám…</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="p-3">Jméno</th>
                <th className="p-3">Email</th>
                <th className="p-3">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u)=> (
                <tr key={u.uid} className="hover:bg-gray-50">
                  <td className="p-3">{u.displayName || '—'}</td>
                  <td className="p-3">{u.email || '—'}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={Boolean(u.isAdmin)} onChange={(e)=>setAdmin(u.uid, e.target.checked)} />
                      <span>{u.isAdmin ? 'ANO' : 'NE'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}




