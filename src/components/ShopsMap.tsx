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
    shops?: Shop[];
}

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function ShopsMap({ className = '', height = '500px', shops: propShops, userLocationCoords, isNearestMode = false }: ShopsMapProps & { userLocationCoords?: { lat: number; lng: number } | null; isNearestMode?: boolean }) {
    const [internalShops, setInternalShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES
    });

    useEffect(() => {
        if (propShops) {
            setLoading(false);
            return;
        }

        const loadShops = async () => {
            if (!db) return;
            setLoading(true);
            try {
                const col = collection(db, 'shops');
                const q = query(col);
                const snap = await getDocs(q);
                const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
                // Sort by order
                docs.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
                setInternalShops(docs);
            } catch (err) {
                console.error('Error loading shops:', err);
                setError('Nepodařilo se načíst seznam prodejen.');
            } finally {
                setLoading(false);
            }
        };
        loadShops();
    }, [propShops]);

    const shopsToRender = propShops || internalShops;

    // Auto-zoom to fit user location and top 3 shops
    useEffect(() => {
        if (isNearestMode && map && isLoaded && userLocationCoords && shopsToRender.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();

            // Add user location
            bounds.extend(new window.google.maps.LatLng(userLocationCoords.lat, userLocationCoords.lng));

            // Add top 3 shops (or fewer if not enough)
            shopsToRender.slice(0, 3).forEach(shop => {
                if (shop.lat && shop.lng) {
                    // Ensure coordinates are numbers and not 0,0
                    const lat = Number(shop.lat);
                    const lng = Number(shop.lng);
                    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
                        bounds.extend(new window.google.maps.LatLng(lat, lng));
                    }
                }
            });

            map.fitBounds(bounds);

            // Remove idle listener for now to debug
        }
    }, [isNearestMode, map, isLoaded, userLocationCoords, shopsToRender]);

    const mapContainerStyle = React.useMemo(() => ({
        width: '100%',
        height: height,
        borderRadius: className.includes('rounded') ? '0.75rem' : '0'
    }), [height, className]);

    const center = React.useMemo(() => ({
        lat: 49.8175,
        lng: 15.4730
    }), []);

    const onLoad = React.useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = React.useCallback(function callback() {
        setMap(null);
    }, []);

    if (loading && !propShops) {
        return (
            <div className={`flex justify-center items-center bg-gray-100 rounded-xl ${className}`} style={{ height }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && !propShops) {
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
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                >
                    {/* User Location Marker */}
                    {userLocationCoords && (
                        <Marker
                            position={userLocationCoords}
                            title="Vaše poloha"
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillOpacity: 1,
                                strokeWeight: 2,
                                fillColor: '#3B82F6', // Blue-500
                                strokeColor: '#ffffff',
                            }}
                        />
                    )}

                    {shopsToRender.map((shop, index) => (
                        shop.lat && shop.lng ? (
                            <Marker
                                key={shop.id}
                                position={{ lat: shop.lat, lng: shop.lng }}
                                title={shop.name}
                                onClick={() => setSelectedShop(shop)}
                                label={isNearestMode && index < 3 ? {
                                    text: (index + 1).toString(),
                                    color: "white",
                                    fontWeight: "bold"
                                } : undefined}
                                zIndex={isNearestMode && index < 3 ? 100 - index : undefined} // Top shops on top
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
