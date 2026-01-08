/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BullsModel {
  id?: string;
  title: string;
  description: string;
  image: string;
  order?: number;
}

export default function BullsBikesPage() {
  const [models, setModels] = useState<BullsModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Try to fetch sorted by order
        const q = query(collection(db, 'bulls_models'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);

        const loadedModels: BullsModel[] = [];
        querySnapshot.forEach((doc) => {
          loadedModels.push({ id: doc.id, ...doc.data() } as BullsModel);
        });

        setModels(loadedModels);
      } catch (error) {
        console.error("Error fetching models:", error);
        // Fallback: fetch without sort if index missing
        if ((error as { code?: string }).code === 'failed-precondition') {
          try {
            const simpleQ = collection(db, 'bulls_models');
            const simpleSnap = await getDocs(simpleQ);
            const simpleModels: BullsModel[] = [];
            simpleSnap.forEach((doc) => {
              simpleModels.push({ id: doc.id, ...doc.data() } as BullsModel);
            });
            // Client side sort if needed
            simpleModels.sort((a, b) => (a.order || 0) - (b.order || 0));
            setModels(simpleModels);
          } catch (innerError) {
            console.error("Fatal error fetching models:", innerError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">BULLS Modelové Řady</h1>
            <p className="mt-4 text-lg text-gray-500">
              Přehled modelových řad elektrokol BULLS pro rok 2025.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Zatím zde nejsou žádné modely.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models.map((model, index) => (
                <div key={model.id || index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                  {/* Image Section */}
                  <div className="bg-white border-b border-gray-100 aspect-video">
                    {model.image ? (
                      <img
                        src={model.image}
                        alt={model.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="mt-2 block text-sm font-medium">Foto připravujeme</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{model.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
