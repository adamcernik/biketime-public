'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, type DocumentData } from 'firebase/firestore';

type Bike = {
  id: string;
  marke?: string;
  modell?: string;
  nrLf?: string;
  bild1?: string;
  farbe?: string;
  motor?: string;
  akku?: string;
  isActive?: boolean;
};

export default function AdminBikeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bike, setBike] = useState<Bike | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!db) return;
      const ref = doc(db, 'bikes', id);
      const snap = await getDoc(ref);
      if (snap.exists()) setBike({ id: snap.id, ...(snap.data() as Partial<Bike>) });
    };
    if (id) void load();
  }, [id]);

  const save = async () => {
    if (!db || !bike) return;
    setSaving(true);
    const { id: bikeId, ...payload } = bike;
    await updateDoc(doc(db, 'bikes', bikeId), payload as DocumentData);
    setSaving(false);
    router.push('/admin/bikes');
  };

  if (!bike) return <div className="text-gray-600">Načítám…</div>;

  return (
    <div className="bg-white rounded shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Upravit kolo</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Značka</div>
          <input value={bike.marke ?? ''} onChange={(e)=>setBike({...bike, marke: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Model</div>
          <input value={bike.modell ?? ''} onChange={(e)=>setBike({...bike, modell: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">NRLF</div>
          <input value={bike.nrLf ?? ''} onChange={(e)=>setBike({...bike, nrLf: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Barva</div>
          <input value={bike.farbe ?? ''} onChange={(e)=>setBike({...bike, farbe: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Motor</div>
          <input value={bike.motor ?? ''} onChange={(e)=>setBike({...bike, motor: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Baterie</div>
          <input value={bike.akku ?? ''} onChange={(e)=>setBike({...bike, akku: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block md:col-span-2">
          <div className="text-sm text-gray-600 mb-1">Obrázek (URL)</div>
          <input value={bike.bild1 ?? ''} onChange={(e)=>setBike({...bike, bild1: e.target.value})} className="w-full rounded px-3 h-10 text-sm shadow-sm" />
        </label>
        <label className="block md:col-span-2">
          <div className="text-sm text-gray-600 mb-1">Zobrazit v katalogu</div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={Boolean(bike.isActive)} onChange={(e)=>setBike({...bike, isActive: e.target.checked})} />
            <span>{bike.isActive ? 'ANO' : 'NE'}</span>
          </label>
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">Uložit</button>
        <button onClick={()=>router.push('/admin/bikes')} className="px-4 py-2 rounded bg-gray-100">Zpět</button>
      </div>
    </div>
  );
}




