import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface BikeFields {
  nrLf?: string;
  lfSn?: string;
  bild1?: string;
  specifications?: Record<string, unknown>;
  mocCzk?: number;
  priceLevelsCzk?: Partial<Record<'A'|'B'|'C'|'D'|'E'|'F', number>>;
  stockSizes?: string[];
  [key: string]: unknown;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const ref = doc(db, 'bikes', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = snap.data() as Record<string, unknown>;
    const bike: BikeFields & { id: string; sizes?: string[]; capacitiesWh?: number[] } = { ...(data as BikeFields), id: snap.id };

    // Attach MOC price (CZK) if present under common keys or specification keys
    const toNumberFromMixed = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
      if (!s) return null;
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };
    const PRICE_KEYS = ['moc','MOC','mocCzk','mocCZK','priceCzk','priceCZK','price','cena','Cena','uvp','UVP','UPE','uvpCZK'];
    const getMocCzk = (b: Record<string, unknown>): number | null => {
      for (const k of PRICE_KEYS) {
        const n = toNumberFromMixed(b[k]);
        if (n != null) return n;
      }
      const spec = ((b.specifications ?? {}) as Record<string, unknown>);
      for (const k of Object.keys(spec)) {
        if (/moc|uvp|price|cena/i.test(k)) {
          const n = toNumberFromMixed(spec[k]);
          if (n != null) return n;
        }
      }
      return null;
    };
    const price = getMocCzk(data);
    // Helpers to determine e‑bike
    const getCategory = (b: Record<string, unknown>): string => {
      const fromTopLevel = (b['Category (PRGR)'] ?? b['Categorie (PRGR)']) as unknown;
      const specs = (b.specifications ?? {}) as Record<string, unknown>;
      const fromSpecs = specs['Category (PRGR)'] ?? specs['Categorie (PRGR)'];
      return (fromTopLevel ?? fromSpecs ?? '').toString();
    };
    const isEbike = (b: Record<string, unknown>): boolean => {
      const cat = getCategory(b).toLowerCase();
      const drive = (((b.specifications ?? {}) as Record<string, unknown>)['Antriebsart (MOTO)'] ?? '').toString().toLowerCase();
      return cat.startsWith('e-') || drive.includes('elektro');
    };
    // Prefer explicitly stored CZK MOC when present (e.g., after import), regardless of e‑bike detection.
    const explicitMoc = toNumberFromMixed((data as Record<string, unknown>)['mocCzk']);
    if (explicitMoc != null) {
      bike.mocCzk = explicitMoc;
    } else if (price != null) {
      // Fallback: derive from common keys/specs for any bike
      bike.mocCzk = price;
    }

    // Extract dealer price levels A–F (CZK). We scan both top-level fields and specifications.
    const getTierPricesCzk = (b: Record<string, unknown>): Partial<Record<'A'|'B'|'C'|'D'|'E'|'F', number>> => {
      const out: Partial<Record<'A'|'B'|'C'|'D'|'E'|'F', number>> = {};
      const tryAssign = (key: string, value: unknown) => {
        const rawKey = key ?? '';
        const keyNorm = String(rawKey).replace(/[\s.\-]/g, '').toLowerCase();
        const keyNoCzk = keyNorm.replace(/czk$/, '');
        // Try forms like 'a','b',... directly
        const direct = keyNoCzk.length === 1 ? keyNoCzk.toUpperCase() : '';
        // Try prefixed forms like 'pricea','cenaa','tierb','levelc'
        const stripped = keyNoCzk.replace(/^(price|cena|cenik|tier|level|pricelist|dealer)/, '');
        const suffix = stripped.length === 1 ? stripped.toUpperCase() : '';
        // Try forms like 'a_price','b_cena'
        const firstChar = keyNoCzk.charAt(0).toUpperCase();
        const restHasPrice = /price|cena|cenik/.test(keyNoCzk.slice(1));
        const candidate = ['A','B','C','D','E','F'].includes(direct)
          ? direct
          : (['A','B','C','D','E','F'].includes(suffix) ? suffix : (restHasPrice && ['A','B','C','D','E','F'].includes(firstChar) ? firstChar : ''));
        if (!candidate) return;
        const n = toNumberFromMixed(value);
        if (n != null) out[candidate as 'A'|'B'|'C'|'D'|'E'|'F'] = n;
      };
      for (const [k, v] of Object.entries(b)) tryAssign(k, v);
      const spec = ((b.specifications ?? {}) as Record<string, unknown>);
      for (const [k, v] of Object.entries(spec)) tryAssign(k, v);
      return out;
    };
    const levels = getTierPricesCzk(data);
    if (Object.keys(levels).length > 0) bike.priceLevelsCzk = levels;

    // Derive sizes for this model by finding same NRLF base among active bikes
    const nr = ((data.nrLf as string | undefined) ?? (data.lfSn as string | undefined) ?? '').toString();
    const m = nr.match(/^(.*?)(\d{2})$/);
    const base = m ? m[1] : nr;
    if (base) {
      const bikesRef = collection(db, 'bikes');
      const q = query(bikesRef, where('isActive', '==', true));
      const list = await getDocs(q);
      const sizes = Array.from(new Set(
        list.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(base))
          .map(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString().match(/(\d{2})$/)?.[1]))
          .filter(Boolean) as string[]
      )).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
      bike.sizes = sizes;

      // Also compute merged battery capacities for this family (third digit from right)
      const capacityCodeToWh: Record<string, number> = { '9': 900, '8': 800, '7': 750, '6': 600, '5': 500, '4': 400 };
      const family = (((data.nrLf as string | undefined) ?? (data.lfSn as string | undefined) ?? '').toString()).replace(/(\d{3})$/, '');
      const capacities = Array.from(new Set(
        list.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(family))
          .map(b => {
            const nr = (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString());
            const code = nr.charAt(Math.max(0, nr.length - 3));
            return capacityCodeToWh[code];
          })
          .filter(Boolean) as number[]
      )).sort((a, b) => a - b);
      if (capacities.length) bike.capacitiesWh = capacities;

      // If detail bike still has no MOC, try to inherit from any family member (prefer explicit mocCzk)
      if ((bike.mocCzk as unknown) == null) {
        const familyDocs = list.docs
          .map(d => d.data() as Record<string, unknown>)
          .filter(b => ((((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString())).startsWith(base));
        const explicitFromFamily = familyDocs
          .map((b) => toNumberFromMixed((b as Record<string, unknown>)['mocCzk']))
          .find((v) => v != null);
        if (explicitFromFamily != null) {
          bike.mocCzk = explicitFromFamily;
        } else {
          const derivedFromFamily = familyDocs.map(getMocCzk).find((v) => v != null);
          if (derivedFromFamily != null) bike.mocCzk = derivedFromFamily;
        }
      }

      // Compute which sizes are in stock (sum of b2bStockQuantity per size > 0)
      const sizeToQty: Record<string, number> = {};
      for (const d of list.docs) {
        const dataDoc = d.data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue; // only aggregate sizes within the same model base
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;
        const qtyRaw = (dataDoc as Record<string, unknown>)['b2bStockQuantity'];
        const qty = typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw ?? 0);
        if (Number.isFinite(qty) && qty > 0) {
          sizeToQty[code] = (sizeToQty[code] ?? 0) + qty;
        }
      }
      const stockSizes = Object.entries(sizeToQty).filter(([,q]) => q > 0).map(([s]) => s).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
      bike.stockSizes = stockSizes;
    }

    return NextResponse.json(bike);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}



