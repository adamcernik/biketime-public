'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shop } from '@/types/Shop';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import ShopsMap from '@/components/ShopsMap';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function PublicShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userLocationCoords, setUserLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isNearestMode, setIsNearestMode] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  useEffect(() => {
    const loadShops = async () => {
      if (!db) return;
      setLoading(true);
      try {
        const col = collection(db, 'shops');
        const q = query(col);
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
        // Sort by order initially
        docs.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert('Vaše zařízení nepodporuje geolokaci.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocationCoords({ lat: latitude, lng: longitude });

        // 1. Sort shops by distance
        const sortedShops = [...shops].sort((a, b) => {
          if (!a.lat || !a.lng) return 1;
          if (!b.lat || !b.lng) return -1;
          const distA = calculateDistance(latitude, longitude, a.lat, a.lng);
          const distB = calculateDistance(latitude, longitude, b.lat, b.lng);
          return distA - distB;
        });

        setShops(sortedShops);
        setIsNearestMode(true);

        // 2. Get address/city using Geocoder
        if (isLoaded && window.google) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

            if (response.results[0]) {
              // Try to find city or locality, fallback to formatted address
              const addressComponents = response.results[0].address_components;
              const cityComponent = addressComponents.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_2'));
              const city = cityComponent ? cityComponent.long_name : response.results[0].formatted_address;
              setUserLocation(city);
            } else {
              setUserLocation('Neznámá poloha');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            setUserLocation('Vaše poloha');
          }
        } else {
          setUserLocation('Vaše poloha');
        }

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Nepodařilo se získat vaši polohu. Zkontrolujte prosím nastavení prohlížeče.');
        setIsLocating(false);
      }
    );
  };

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
            <p className="mt-4 text-lg text-gray-500 mb-8">
              Navštivte jednu z našich prodejen a vyzkoušejte si kola na vlastní kůži.
            </p>

            <button
              onClick={handleFindNearest}
              disabled={isLocating}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLocating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Zjišťuji polohu...
                </>
              ) : (
                <>
                  <MapPinIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  NAJÍT NEJBLIŽŠÍ OBCHOD
                </>
              )}
            </button>

            {userLocation && (
              <p className="mt-4 text-sm text-gray-600 animate-in fade-in slide-in-from-bottom-2">
                Jste v: <span className="font-semibold text-gray-900">{userLocation}</span>
              </p>
            )}
          </div>

          {/* Closest Shops Highlight */}
          {isNearestMode && shops.length > 0 && (
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Nejbližší prodejny</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shops.slice(0, 3).map((shop, index) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-xl shadow-lg border-2 border-primary relative overflow-hidden transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                      #{index + 1} NEJBLIŽŠÍ
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">{shop.name}</h3>

                      <div className="space-y-3 text-gray-600">
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{shop.address}</span>
                        </div>

                        {shop.website && (
                          <div className="flex items-center gap-3">
                            <GlobeAltIcon className="w-5 h-5 text-primary shrink-0" />
                            <a
                              href={shop.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate font-medium"
                            >
                              {shop.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 block w-full text-center py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium transition-colors border border-gray-200"
                        >
                          Navigovat
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
            <ShopsMap height="500px" shops={shops} userLocationCoords={userLocationCoords} isNearestMode={isNearestMode} />
          </div>

          {/* Shops List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isNearestMode ? shops.slice(3) : shops).map((shop) => (
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
