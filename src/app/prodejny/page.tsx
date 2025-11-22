'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shop } from '@/types/Shop';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import ShopsMap from '@/components/ShopsMap';

export default function PublicShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const loadShops = async () => {
      if (!db) return;
      setLoading(true);
      try {
        const col = collection(db, 'shops');
        // Optionally filter for active shops if you have an isActive flag
        // const q = query(col, where('isActive', '==', true));
        const q = query(col);
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
        setShops(docs);
      } catch (err) {
        console.error('Error loading shops:', err);
        setError('Nepodařilo se načíst seznam prodejen.');
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, []);



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Naše prodejny</h1>
            <p className="mt-4 text-lg text-gray-500">
              Navštivte jednu z našich prodejen a vyzkoušejte si kola na vlastní kůži.
            </p>
          </div>

          {/* Map Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
            <ShopsMap height="500px" />
          </div>

          {/* Shops List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md"
                id={`shop-${shop.id}`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{shop.name}</h3>

                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{shop.address}</span>
                    </div>

                    {shop.website && (
                      <div className="flex items-center gap-3">
                        <GlobeAltIcon className="w-5 h-5 text-gray-400 shrink-0" />
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {shop.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
