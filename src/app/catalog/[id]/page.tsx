import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { findReplacementsForMissing } from '@/lib/catalog-fallback';
import ProductDetailClient from './ProductDetailClient';
import ProductUnavailable from '@/components/ProductUnavailable';

// Existence is checked per request (catalog changes); the real detail content,
// including auth-gated dealer prices, still loads client-side in ProductDetailClient.
export const dynamic = 'force-dynamic';

async function getBasic(id: string): Promise<{ brand: string; model: string; year: unknown } | null> {
    const snap = await adminDb.collection('products_v2').doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as Record<string, unknown>;
    return { brand: String(d.brand ?? ''), model: String(d.model ?? ''), year: d.year };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const basic = await getBasic(id);
    if (!basic) {
        // Soft-404 fallback must not be indexed; links should still be followed.
        return { title: 'Kolo už není v nabídce | Biketime', robots: { index: false, follow: true } };
    }
    const title = [basic.brand, basic.model, basic.year].filter(Boolean).join(' ');
    return { title: `${title} | Biketime` };
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const snap = await adminDb.collection('products_v2').doc(id).get();

    if (snap.exists) {
        return <ProductDetailClient id={id} />;
    }

    // Gone from the catalog — keep the shared link useful instead of a hard 404.
    const info = await findReplacementsForMissing(id);
    return <ProductUnavailable {...info} />;
}
