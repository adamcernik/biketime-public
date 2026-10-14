'use client';

import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { useGoogleMaps } from '@/lib/useGoogleMaps';

// Nekvasilova 31, Praha 8 (OSM geokódování)
const SHOWROOM = { lat: 50.097614, lng: 14.467022 };

export default function KontaktMap({ className = '' }: { className?: string }) {
  const { isLoaded } = useGoogleMaps();

  return (
    <div className={`overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={SHOWROOM}
          zoom={15}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          <MarkerF position={SHOWROOM} title="Showroom a servis — Nekvasilova 31" />
        </GoogleMap>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Načítání mapy...' : 'Mapa není k dispozici'}
        </div>
      )}
    </div>
  );
}
