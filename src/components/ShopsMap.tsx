'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shop } from '@/types/Shop';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface ShopsMapProps {
    className?: string;
    height?: string;
}

export default function ShopsMap({ className = '', height = '500px' }: ShopsMapProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
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

    const mapContainerStyle = {
        width: '100%',
        height: height,
        borderRadius: className.includes('rounded') ? '0.75rem' : '0'
    };

    const center = {
        lat: 49.8175,
        lng: 15.4730
    };

    if (loading) {
        return (
            <div className={`flex justify-center items-center bg-gray-100 rounded-xl ${className}`} style={{ height }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex justify-center items-center bg-red-50 rounded-xl border border-red-200 p-4 ${className}`} style={{ height }}>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={7}
                >
                    {shops.map((shop) => (
                        shop.lat && shop.lng ? (
                            <Marker
                                key={shop.id}
                                position={{ lat: shop.lat, lng: shop.lng }}
                                title={shop.name}
                                onClick={() => setSelectedShop(shop)}
                            />
                        ) : null
                    ))}
                </GoogleMap>
            ) : (
                <div className="bg-gray-100 flex items-center justify-center text-gray-500 rounded-xl" style={{ height }}>
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Načítání mapy...' : 'Chybí API klíč pro Google Maps'}
                </div>
            )}

            {/* Info Window Overlay */}
            {selectedShop && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900">{selectedShop.name}</h3>
                        <button
                            onClick={() => setSelectedShop(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                            <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{selectedShop.address}</span>
                        </div>
                        {selectedShop.website && (
                            <div className="flex items-center gap-2">
                                <GlobeAltIcon className="w-4 h-4 shrink-0" />
                                <a
                                    href={selectedShop.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                >
                                    Web prodejny
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
