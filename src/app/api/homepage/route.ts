/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Fetch homepage configuration
    let cfgSnap = await adminDb.collection('settings').doc('homepage').get();
    if (!cfgSnap.exists) {
      cfgSnap = await adminDb.collection('site').doc('homepage').get();
    }
    const featuredIds: string[] = (cfgSnap.exists ? (cfgSnap.data()?.featuredIds ?? []) : []) as string[];

    const bikes: any[] = [];

    // Fetch products from products_v2 collection
    for (const id of featuredIds.slice(0, 3)) {
      const productSnap = await adminDb.collection('products_v2').doc(id).get();

      if (productSnap.exists) {
        const product = productSnap.data() as any;

        // Transform products_v2 data to match SimpleBikeCard interface
        bikes.push({
          id: productSnap.id,
          marke: product.brand ?? '',
          modell: product.model ?? '',
          bild1: product.images?.[0] ?? '',
          mocCzk: product.minPrice ?? null,
          motor: product.specs?.motor ?? '',
          akku: product.specs?.battery ?? product.specs?.capacity ?? '',
        });
      }
    }

    return NextResponse.json({ featured: bikes, ids: featuredIds });
  } catch (e) {
    console.error('Homepage API error', e);
    return NextResponse.json({ featured: [], ids: [] }, { status: 200 });
  }
}
