/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { dealerPriceForMoc } from '@/lib/b2bPrice';
import { variantAvailability, VariantAvailabilityState } from '@/lib/availability';
import { isEbikeProduct, mapRawToTag } from '@/lib/catalogMapping';
import { sortSizes, standardizeSize, detectCategory } from '@/lib/size-mapping';

// Builder dealerského ceníku: řádek = model × barva × baterie, velikosti
// sloučené (cena se velikostí nemění). VOC se počítá pro hladinu partnera
// stejnou prioritou jako objednávky a detail produktu:
// variant.b2bPrice > manualB2BPrice/b2bPrice produktu > dealerPriceForMoc.

export interface CenikSize {
    size: string;
    variantId: string;
    ean?: string;
    availability: VariantAvailabilityState;
}

export interface CenikRow {
    key: string;
    productId: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    isEbike: boolean;
    color: string;
    capacity?: string;
    image?: string;
    /** MOC s DPH */
    moc: number | null;
    /** VOC bez DPH pro hladinu partnera */
    voc: number | null;
    /** Nejlepší dostupnost napříč velikostmi */
    availability: VariantAvailabilityState;
    sizes: CenikSize[];
}

export interface CenikData {
    level: 'A' | 'B' | 'C' | 'D';
    generatedAt: string;
    rows: CenikRow[];
}

const AVAILABILITY_RANK: Record<VariantAvailabilityState, number> = {
    'ours': 5,
    'zeg-stock': 4,
    'zeg-low': 3,
    'zeg-date': 2,
    'on-order': 1,
    'none': 0,
};

function bestAvailability(states: VariantAvailabilityState[]): VariantAvailabilityState {
    return states.reduce((acc, s) => (AVAILABILITY_RANK[s] > AVAILABILITY_RANK[acc] ? s : acc), 'none');
}

export async function buildCenik(level: 'A' | 'B' | 'C' | 'D' | undefined): Promise<CenikData> {
    const effectiveLevel = level || 'A';
    const snapshot = await adminDb.collection('products_v2').get();

    const rows: CenikRow[] = [];

    snapshot.forEach((doc) => {
        const p = doc.data() as any;
        // Archivované a předobjednávkové (2027 bez cen) do ceníku nepatří
        if (p.archived === true || p.preorderOnly === true) return;
        const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
        if (variants.length === 0) return;

        const isE = isEbikeProduct(p);
        const category = mapRawToTag(String(p.category || ''), isE) || String(p.category || '');
        const sizeCategory = detectCategory({ categoryPrgr: p.category, modell: p.model });

        // Skupiny model × barva × baterie
        const groups = new Map<string, any[]>();
        for (const v of variants) {
            if (v?.id === undefined || v?.id === null) continue;
            const gKey = `${String(v.color || '').trim()}|${String(v.capacity || '').trim()}`;
            if (!groups.has(gKey)) groups.set(gKey, []);
            groups.get(gKey)!.push(v);
        }

        groups.forEach((groupVariants, gKey) => {
            const [color, capacity] = gKey.split('|');

            const sizes: CenikSize[] = groupVariants
                .map((v) => ({
                    size: standardizeSize(String(v.size || ''), sizeCategory) || String(v.size || ''),
                    variantId: String(v.id),
                    ean: v.ean ? String(v.ean) : undefined,
                    availability: variantAvailability(p, v),
                }))
                .sort((a, b) => sortSizes(a.size, b.size));

            // Reprezentativní varianta pro ceny: první s MOC
            const priced = groupVariants.find((v) => Number(v.price) > 0);
            const moc = priced ? Number(priced.price) : null;

            let voc: number | null = dealerPriceForMoc(p, effectiveLevel, moc);
            const variantB2b = priced ? Number(priced.b2bPrice) || 0 : 0;
            const rootManual = Number(p.manualB2BPrice) || Number(p.b2bPrice) || 0;
            if (variantB2b > 0) voc = variantB2b;
            else if (rootManual > 0) voc = rootManual;
            if (voc != null) voc = Math.round(voc);

            rows.push({
                key: `${doc.id}|${gKey}`,
                productId: doc.id,
                brand: String(p.brand || ''),
                model: String(p.model || ''),
                year: Number(p.year) || 0,
                category,
                isEbike: isE,
                color,
                capacity: capacity || undefined,
                image: groupVariants.find((v) => v.images?.[0])?.images?.[0] || p.images?.[0],
                moc,
                voc,
                availability: bestAvailability(sizes.map((s) => s.availability)),
                sizes,
            });
        });
    });

    rows.sort((a, b) =>
        a.category.localeCompare(b.category, 'cs')
        || a.model.localeCompare(b.model, 'cs')
        || (b.year - a.year)
        || String(a.capacity || '').localeCompare(String(b.capacity || ''))
        || a.color.localeCompare(b.color, 'cs'));

    return {
        level: effectiveLevel,
        generatedAt: new Date().toISOString(),
        rows,
    };
}
