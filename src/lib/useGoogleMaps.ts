'use client';

import { useJsApiLoader, type Libraries } from '@react-google-maps/api';

/**
 * Shared Google Maps JS API loader.
 *
 * The API must be loaded exactly once per page. Previously both the /prodejny
 * page (for the Geocoder) and the ShopsMap component called useJsApiLoader with
 * their OWN `libraries` array — two different references made the library think
 * the options changed and it injected the bootstrap script twice, causing
 * "Element with name 'gmp-map' already defined" errors and an empty map.
 *
 * Using one shared hook with a single stable `LIBRARIES` constant and the same
 * id makes every caller share a single load.
 */
const LIBRARIES: Libraries = ['places'];

export function useGoogleMaps() {
  return useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });
}
