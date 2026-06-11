import type { MetadataRoute } from 'next';
import { db } from '@/lib/firebase-server';
import { collection, getDocs } from 'firebase/firestore';

export const revalidate = 86400; // refresh once a day

const BASE_URL = 'https://biketime.cz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/skladem`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/prislusenstvi`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/prodejny`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/kola-bulls`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/kontakt`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/ke-stazeni`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/size-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/podminky-uziti`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/ochrana-osobnich-udaju`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Product detail pages — best effort; never fail the sitemap on a data error
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const snapshot = await getDocs(collection(db, 'products_v2'));
    productRoutes = snapshot.docs.map((d) => ({
      url: `${BASE_URL}/catalog/${d.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('sitemap: failed to load products', e);
  }

  return [...staticRoutes, ...productRoutes];
}
