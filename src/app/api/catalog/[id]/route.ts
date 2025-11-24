import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface BikeFields {
  nrLf?: string;
  lfSn?: string;
  bild1?: string;
  specifications?: Record<string, unknown>;
  mocCzk?: number;
  stockSizes?: string[];
  onTheWaySizes?: string[];
  nrLfBase?: string;
  stockQtyBySize?: Record<string, number>;
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
    const PRICE_KEYS = ['moc', 'MOC', 'mocCzk', 'mocCZK', 'priceCzk', 'priceCZK', 'price', 'cena', 'Cena', 'uvp', 'UVP', 'UPE', 'uvpCZK'];
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
      if (typeof b.isEbike === 'boolean') return b.isEbike;
      const cat = getCategory(b).toLowerCase();
      const spec = (b.specifications ?? {}) as Record<string, unknown>;
      const drive = (spec['Antriebsart (MOTO)'] ?? '').toString().toLowerCase();
      const motor = (spec['Motor (MOTM)'] ?? spec['Motor (MOTO)'] ?? b.motor ?? '').toString().toLowerCase();
      const battery = (spec['Akku (AKKU)'] ?? spec['Akkumodell (AKKU)'] ?? spec['Battery (Wh) (AKLW)'] ?? b.akku ?? '').toString().toLowerCase();
      const modelName = (b.modell ?? '').toString().toLowerCase();
      return (
        cat.startsWith('e-') ||
        drive.includes('elektro') ||
        motor.length > 0 ||
        battery.length > 0 ||
        modelName.startsWith('e-') ||
        modelName.includes('e-stream')
      );
    };
    // no-op: e‑bike detection not needed in detail for price logic
    // Prefer explicitly stored CZK MOC when present (e.g., after import), regardless of e‑bike detection.
    const explicitMoc = toNumberFromMixed((data as Record<string, unknown>)['mocCzk']);
    if (explicitMoc != null) {
      bike.mocCzk = explicitMoc;
    } else if (price != null) {
      // Fallback: derive from common keys/specs for any bike
      bike.mocCzk = price;
    }

    // Dealer tier prices (A–F) are intentionally not exposed in the public API.

    // Derive sizes for this model by finding same NRLF base among active bikes
    const nr = ((data.nrLf as string | undefined) ?? (data.lfSn as string | undefined) ?? '').toString();
    const m = nr.match(/^(.*?)(\d{2})$/);
    const base = m ? m[1] : nr;
    bike.nrLfBase = base || '';
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

      // ONLY for E-bikes
      if (isEbike(data)) {
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
      }

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

      // Compute which sizes are in stock; prefer our stock list when available, otherwise fallback to B2B quantity
      const stockSnap = await getDocs(collection(db, 'stock'));
      const useOurStock = stockSnap.size > 0;
      const toNum = (v: unknown): number => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        const s = String(v ?? '').replace(/[^0-9.-]/g, '');
        const n = Number(s || '0');
        return Number.isFinite(n) ? n : 0;
      };
      // Compute size availability:
      // - Prefer OUR stock list when present (stock + inTransit); otherwise fallback to B2B only
      const nrToStock: Record<string, { stock: number; inTransit: number }> = {};
      if (useOurStock) {
        for (const s of stockSnap.docs) {
          const d = s.data() as Record<string, unknown>;
          const key = ((d.nrLf as string | undefined) ?? (d.nrlf as string | undefined) ?? s.id ?? '').toString().trim();
          if (!key) continue;
          const sd = d as { stock?: unknown; qty?: unknown; onHand?: unknown; inTransit?: unknown; in_transit?: unknown; incoming?: unknown };
          nrToStock[key] = {
            stock: toNum(sd.stock ?? sd.qty ?? sd.onHand ?? 0),
            inTransit: toNum(sd.inTransit ?? sd.in_transit ?? sd.incoming ?? 0),
          };
        }
      }
      const sizeToQty: Record<string, number> = {};
      for (const d of list.docs) {
        const dataDoc = d.data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue;
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;
        const ours = nrToStock[nrDoc];
        const oursQty = (ours?.stock ?? 0) + (ours?.inTransit ?? 0);
        const b2bRaw = (dataDoc as Record<string, unknown>)['b2bStockQuantity'];
        const b2bQty = typeof b2bRaw === 'number' ? b2bRaw : Number(b2bRaw ?? 0);
        const eff = useOurStock ? (Number.isFinite(oursQty) ? oursQty : 0) : (Number.isFinite(b2bQty) ? b2bQty : 0);
        if (eff > 0) sizeToQty[code] = (sizeToQty[code] ?? 0) + eff;
      }
      bike.stockSizes = Object.entries(sizeToQty).filter(([, q]) => q > 0).map(([s]) => s).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
      bike.stockQtyBySize = sizeToQty;

      // Compute on-the-way sizes (in transit)
      const sizeToTransit: Record<string, number> = {};
      for (const d of list.docs) {
        const dataDoc = d.data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue;
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;
        if (useOurStock) {
          const ours = (nrToStock as Record<string, { inTransit: number }>)[nrDoc];
          const tran = (ours?.inTransit ?? 0);
          if (tran > 0) sizeToTransit[code] = (sizeToTransit[code] ?? 0) + tran;
        }
      }
      bike.onTheWaySizes = Object.entries(sizeToTransit).filter(([, q]) => q > 0).map(([s]) => s).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));

      const sizeToNrLf: Record<string, string> = {};
      for (const d of list.docs) {
        const dataDoc = d.data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue;
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;
        sizeToNrLf[code] = nrDoc;
      }
      bike.sizeToNrLf = sizeToNrLf;

      // Compute full battery variants
      const currentSize = bike.nrLf?.match(/(\d{2})$/)?.[1];
      const variants: Record<string, unknown>[] = [];

      // ONLY for E-bikes
      if (isEbike(data)) {
        for (const capCode of Object.keys(capacityCodeToWh)) {
          const capWh = capacityCodeToWh[capCode];
          // Find all bikes for this capacity
          const variantDocs = list.docs.filter(d => {
            const dData = d.data() as Record<string, unknown>;
            const dNr = (((dData.nrLf as string | undefined) ?? (dData.lfSn as string | undefined) ?? '').toString());
            if (!dNr.startsWith(family)) return false;
            const dCode = dNr.charAt(Math.max(0, dNr.length - 3));
            return dCode === capCode;
          });

          if (variantDocs.length === 0) continue;

          // Find representative ID (prefer same size)
          let repDoc = variantDocs.find(d => {
            const dNr = (((d.data().nrLf as string | undefined) ?? (d.data().lfSn as string | undefined) ?? '').toString());
            return dNr.endsWith(currentSize || 'XX');
          });
          if (!repDoc) repDoc = variantDocs[0];

          const repData = repDoc.data() as Record<string, unknown>;

          // Compute variant-specific data
          const vSizes: string[] = [];
          const vStockSizes: string[] = [];
          const vOnTheWaySizes: string[] = [];
          const vStockQty: Record<string, number> = {};
          const vSizeToNrLf: Record<string, string> = {};

          // Compute sizes and stock for this variant
          for (const d of variantDocs) {
            const dData = d.data() as Record<string, unknown>;
            const dNr = (((dData.nrLf as string | undefined) ?? (dData.lfSn as string | undefined) ?? '').toString());
            const code = dNr.match(/(\d{2})$/)?.[1];
            if (!code) continue;

            vSizes.push(code);
            vSizeToNrLf[code] = dNr;

            const ours = nrToStock[dNr];
            const oursQty = (ours?.stock ?? 0) + (ours?.inTransit ?? 0);
            const b2bRaw = (dData as Record<string, unknown>)['b2bStockQuantity'];
            const b2bQty = typeof b2bRaw === 'number' ? b2bRaw : Number(b2bRaw ?? 0);
            const eff = useOurStock ? (Number.isFinite(oursQty) ? oursQty : 0) : (Number.isFinite(b2bQty) ? b2bQty : 0);

            if (eff > 0) {
              vStockQty[code] = (vStockQty[code] ?? 0) + eff;
              vStockSizes.push(code);
            }

            if (useOurStock && (ours?.inTransit ?? 0) > 0) {
              vOnTheWaySizes.push(code);
            }
          }

          // Sort sizes
          vSizes.sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
          vStockSizes.sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
          vOnTheWaySizes.sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));

          // Get Price
          let vMoc = toNumberFromMixed(repData['mocCzk']);
          if (vMoc == null) vMoc = getMocCzk(repData);

          variants.push({
            id: repDoc.id,
            capacityWh: capWh,
            akku: repData.akku,
            nrLf: repData.nrLf,
            mocCzk: vMoc,
            sizes: Array.from(new Set(vSizes)),
            stockSizes: Array.from(new Set(vStockSizes)),
            onTheWaySizes: Array.from(new Set(vOnTheWaySizes)),
            stockQtyBySize: vStockQty,
            sizeToNrLf: vSizeToNrLf,
            specifications: repData.specifications,
          });
        }

        bike.batteryVariants = variants.sort((a, b) => {
          const capA = (a['capacityWh'] as number) || 0;
          const capB = (b['capacityWh'] as number) || 0;
          return capA - capB;
        });
      }
    }

    return NextResponse.json(bike);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}



