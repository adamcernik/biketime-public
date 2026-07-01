import { adminDb } from '@/lib/firebase-admin';
import type { SimpleBikeCardProps } from '@/components/SimpleBikeCard';

// A product detail URL is /catalog/<id>, where <id> is the products_v2 document id
// — a deterministic brand-model-year slug (e.g. "bulls-aminga-eva-tr-1-27-5-2025").
// That makes shared links permanent. This module keeps a link useful even when the
// exact product is gone (sold out / renamed in an import) by finding a successor
// (same model, newest year) and similar bikes instead of returning a hard 404.

const YEAR_RE = /^(19|20)\d{2}$/;

export interface MissingProductInfo {
    modelLabel: string;               // Human-readable model, e.g. "Aminga Eva Tr 1 27 5"
    searchTerm: string;               // Space-joined model tokens for the catalog search
    successor: SimpleBikeCardProps | null; // Same model core, newest year still offered
    similar: SimpleBikeCardProps[];   // Same category / first model token, newest first
}

// Split a slug into brand, model tokens and year. The last token counts as the year
// only when it matches a 4-digit 19xx/20xx — otherwise it stays part of the model.
function parseSlug(id: string): { brand: string; modelTokens: string[]; year: number | null } {
    const parts = (id || '').toLowerCase().split('-').filter(Boolean);
    let year: number | null = null;
    if (parts.length && YEAR_RE.test(parts[parts.length - 1])) {
        year = parseInt(parts.pop()!, 10);
    }
    const brand = parts.shift() || '';
    return { brand, modelTokens: parts, year };
}

type Row = {
    id: string;
    brand: string;
    model: string;
    year: number;
    category: string;
    image: string;
    mocCzk: number | null;
};

function toCard(r: Row): SimpleBikeCardProps {
    return { id: r.id, marke: r.brand, modell: r.model, bild1: r.image, mocCzk: r.mocCzk };
}

// Cold path (only hit on a missing product), so a single light scan of the catalog
// is fine. select() keeps the payload to the few fields we actually need.
async function loadAll(): Promise<Row[]> {
    const snap = await adminDb
        .collection('products_v2')
        .select('brand', 'model', 'year', 'category', 'images', 'minPrice')
        .get();
    return snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const year = typeof data.year === 'number' ? data.year : parseInt(String(data.year ?? ''), 10) || 0;
        const images = Array.isArray(data.images) ? (data.images as string[]) : [];
        return {
            id: d.id,
            brand: typeof data.brand === 'string' ? data.brand : '',
            model: typeof data.model === 'string' ? data.model : '',
            year,
            category: typeof data.category === 'string' ? data.category : '',
            image: images[0] ?? '',
            mocCzk: typeof data.minPrice === 'number' ? data.minPrice : null,
        };
    });
}

const modelCoreOf = (id: string) => parseSlug(id).modelTokens.join('-');

export async function findReplacementsForMissing(id: string, limit = 4): Promise<MissingProductInfo> {
    const { modelTokens } = parseSlug(id);
    const modelCore = modelTokens.join('-');
    const searchTerm = modelTokens.join(' ').trim();
    const modelLabel = modelTokens
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join(' ')
        .trim();

    const all = await loadAll();

    // Successor: same year-stripped model core, any year — prefer the newest.
    let successor: Row | null = null;
    if (modelCore) {
        successor = all
            .filter((p) => modelCoreOf(p.id) === modelCore)
            .sort((a, b) => b.year - a.year)[0] || null;
    }

    // No URL sections in Biketime (single /catalog); category is the closest analog.
    // Scope similar to the successor's category when we have one, else the whole catalog.
    const pool = successor ? all.filter((p) => p.category === successor!.category) : all;

    const seen = new Set<string>(successor ? [successor.id] : []);

    // Primary: same first model token, newest first.
    let similar = modelTokens.length
        ? pool
              .filter((p) => !seen.has(p.id) && parseSlug(p.id).modelTokens.includes(modelTokens[0]))
              .sort((a, b) => b.year - a.year)
        : [];
    similar.forEach((p) => seen.add(p.id));

    // Top up with the newest bikes from the pool so the page is never empty.
    if (similar.length < limit) {
        const filler = pool.filter((p) => !seen.has(p.id)).sort((a, b) => b.year - a.year);
        similar = similar.concat(filler);
    }

    return {
        modelLabel,
        searchTerm,
        successor: successor ? toCard(successor) : null,
        similar: similar.slice(0, limit).map(toCard),
    };
}
