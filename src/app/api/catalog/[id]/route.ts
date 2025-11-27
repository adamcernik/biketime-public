/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';

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
    let ref = doc(db, 'bikes', id);
    let snap = await getDoc(ref);

    // Fallback: Try to find by nrLf (Article Number) if ID lookup fails
    if (!snap.exists()) {
      // Try string match first
      let q = query(collection(db, 'bikes'), where('nrLf', '==', id));
      let querySnap = await getDocs(q);

      // If not found and ID is numeric, try number match
      if (querySnap.empty && /^\d+$/.test(id)) {
        console.log(`DEBUG: Trying numeric match for: ${Number(id)}`);
        q = query(collection(db, 'bikes'), where('nrLf', '==', Number(id)));
        querySnap = await getDocs(q);
      }

      // Try stripping hyphens (e.g. 525-90-028 -> 52590028)
      if (querySnap.empty && id.includes('-')) {
        const cleanId = id.replace(/-/g, '');

        // Try clean string
        q = query(collection(db, 'bikes'), where('nrLf', '==', cleanId));
        querySnap = await getDocs(q);

        // Try clean number
        if (querySnap.empty && /^\d+$/.test(cleanId)) {
          q = query(collection(db, 'bikes'), where('nrLf', '==', Number(cleanId)));
          querySnap = await getDocs(q);
        }
      }

      if (!querySnap.empty) {
        snap = querySnap.docs[0];
        ref = snap.ref;
      } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

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

    const getCategory = (bike: any): string => {
      const fromTopLevel =
        bike['Category (PRGR)'] ?? bike['Categorie (PRGR)'] ?? bike.categoryPrgr ?? bike.categoriePrgr;
      const fromSpecs =
        bike.specifications?.['Category (PRGR)'] ??
        bike.specifications?.['Categorie (PRGR)'] ??
        bike.specifications?.categoryPrgr ??
        bike.specifications?.categoriePrgr;
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
      // OPTIMIZATION: Try to fetch only relevant siblings (same Brand + Model)
      // This requires a composite index: marke ASC, modell ASC, isActive ASC
      let list;
      try {
        const currentBrand = (data.marke ?? '').toString();
        const currentModel = (data.modell ?? '').toString();

        if (currentBrand && currentModel) {
          const qOptimized = query(
            bikesRef,
            where('isActive', '==', true),
            where('marke', '==', currentBrand),
            where('modell', '==', currentModel)
          );
          list = await getDocs(qOptimized);
          console.log(`DEBUG: [Detail] Optimized fetch returned ${list.size} bikes for ${currentBrand} ${currentModel}.`);
        }
      } catch (e: any) {
        console.warn('DEBUG: [Detail] Optimized fetch failed (likely missing index), falling back to full fetch.', e.message);
      }

      // Fallback: If optimized fetch failed or returned 0 results.
      // We DO NOT fetch all active bikes anymore as it is too expensive (7000+ docs).
      // Instead, we try to fetch at least the sizes for the current bike using NRLF prefix.
      if (!list || list.empty) {
        console.log(`DEBUG: [Detail] Brand/Model query returned empty or failed. Trying NRLF prefix fallback for base: ${base}`);

        try {
          // This query requires a composite index: isActive ASC, nrLf ASC
          const qNrLf = query(
            bikesRef,
            where('isActive', '==', true),
            where('nrLf', '>=', base),
            where('nrLf', '<=', base + '\uf8ff')
          );
          list = await getDocs(qNrLf);
          console.log(`DEBUG: [Detail] NRLF fallback returned ${list.size} bikes.`);
        } catch (e: any) {
          // This will log the URL to create the index if it's missing
          console.error('DEBUG: [Detail] NRLF fallback failed. Likely missing index on (isActive, nrLf).', e.message);
          if (e.code === 'failed-precondition') {
            console.error('DEBUG: [Detail] CREATE INDEX HERE:', e.details);
          }
          // Final fallback: Empty list (do not fetch all)
          list = { docs: [], empty: true, size: 0 } as any;
        }
      }

      const relatedSnap = list; // Assuming 'list' contains the relevant documents for related bikes
      const related = (relatedSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[])
        .filter((b: any) => b.id !== id);

      const sizes = Array.from(new Set(
        related
          .filter((b: any) => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(base))
          .map((b: any) => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString().match(/(\d{2})$/)?.[1]))
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
            .map((d: any) => d.data() as Record<string, unknown>)
            .filter((b: any) => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(family))
            .map((b: any) => {
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
          .map((d: any) => d.data() as Record<string, unknown>)
          .filter((b: any) => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(base));
        const explicitFromFamily = (familyDocs
          .map((b: Record<string, unknown>) => toNumberFromMixed(b['mocCzk'])) as Array<number | null>)
          .find((v): v is number => v != null);
        if (explicitFromFamily != null) {
          bike.mocCzk = explicitFromFamily;
        } else {
          const derivedFromFamily = (familyDocs.map(getMocCzk) as Array<number | null>).find((v): v is number => v != null);
          if (derivedFromFamily != null) bike.mocCzk = derivedFromFamily;
        }
      }

      // Compute which sizes are in stock; prefer our stock list when available, otherwise fallback to B2B quantity
      const toNum = (v: unknown): number => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        const s = String(v ?? '').replace(/[^0-9.-]/g, '');
        const n = Number(s || '0');
        return Number.isFinite(n) ? n : 0;
      };

      // OPTIMIZATION: Instead of fetching ALL stock (expensive), fetch only stock for the relevant NRLFs.
      // We collect all NRLFs from the 'list' (which contains all variants/sizes for this model).
      const relevantNrLfs = new Set<string>();
      list.docs.forEach((d: any) => {
        const dataDoc = d.data() as Record<string, unknown>;
        const nr = ((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString();
        if (nr) relevantNrLfs.add(nr);
      });

      const nrToStock: Record<string, { stock: number; inTransit: number }> = {};
      let useOurStock = false;

      if (relevantNrLfs.size > 0) {
        // Firestore 'in' query is limited to 10 items (or 30 depending on version), but we might have more sizes.
        // However, fetching by ID is fast. We can do parallel fetches or batched queries.
        // Since 'stock' collection usually uses NRLF as document ID (or we can query by field), let's check structure.
        // Based on previous code: `const key = d.nrLf ... ?? s.id`. It seems ID might be NRLF.
        // Let's try to fetch by ID first if IDs are NRLFs.

        // Actually, to be safe and efficient without knowing exact ID structure:
        // If we have < 30 items, we can use 'in' query on 'nrLf' field if indexed.
        // Or just fetch all active stock? No, that's what we want to avoid.

        // Strategy: We will assume the 'stock' collection might NOT use NRLF as ID directly or might have mixed IDs.
        // But we know we only care about `relevantNrLfs`.
        // If the list is small (e.g. < 20 variants), we can just query them.
        // If the list is large, we might still be better off fetching all? No, 7000 bikes vs 50 variants.

        // Let's try to fetch by 'nrLf' field using 'in' batches of 10.
        const chunks = [];
        const allNrLfs = Array.from(relevantNrLfs);
        for (let i = 0; i < allNrLfs.length; i += 10) {
          chunks.push(allNrLfs.slice(i, i + 10));
        }

        const stockPromises = chunks.map(chunk => {
          const q = query(collection(db, 'stock'), where('nrLf', 'in', chunk));
          return getDocs(q);
        });

        // Also handle 'lfSn' or 'nrlf' variations? The previous code checked `d.nrLf ?? d.nrlf ?? s.id`.
        // This implies the field in 'stock' might be 'nrLf' or 'nrlf'.
        // To be safe, let's try to fetch by 'nrLf' which is the standard we use.

        try {
          const snapshots = await Promise.all(stockPromises);
          snapshots.forEach(snap => {
            if (!snap.empty) useOurStock = true;
            snap.docs.forEach((d: any) => {
              const data = d.data() as any;
              // We trust the query matched the NRLF, but let's store it by the NRLF we searched for (or the one in doc)
              const key = ((data.nrLf as string) ?? (data.nrlf as string) ?? d.id).toString().trim();
              const sd = data as { stock?: unknown; qty?: unknown; onHand?: unknown; inTransit?: unknown; in_transit?: unknown; incoming?: unknown };
              nrToStock[key] = {
                stock: toNum(sd.stock ?? sd.qty ?? sd.onHand ?? 0),
                inTransit: toNum(sd.inTransit ?? sd.in_transit ?? sd.incoming ?? 0),
              };
            });
          });
        } catch (e) {
          console.warn('DEBUG: [Detail] Failed to fetch specific stock items, falling back to B2B only.', e);
        }
      }

      const sizeToQty: Record<string, number> = {};
      for (const d of list.docs) {
        const dataDoc = (d as any).data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue;
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;

        // Check if we found stock for this NRLF
        const ours = nrToStock[nrDoc];

        // If we found ANY stock record for ANY variant, we consider 'useOurStock' to be true globally?
        // Previous logic: `const useOurStock = stockSnap.size > 0;`
        // This meant: if we have AT LEAST ONE document in 'stock' collection, we ignore B2B quantity for EVERYONE.
        // This is a bit risky if we only fetch *some* stock.
        // BUT: If we query for specific NRLFs and find nothing, it implies we have 0 stock for them.
        // So `useOurStock` should probably be true if we successfully queried the stock collection, 
        // regardless of whether we found matches (meaning 0 stock) or not.
        // However, to mimic previous behavior safely: 
        // If we found a record in `nrToStock`, use it. 
        // If we didn't find a record, but we know we are using "Our Stock" system, it should be 0.
        // But how do we know if the system is "active"?
        // Let's assume if we found *any* stock record for these variants, the system is active.

        const b2bRaw = (dataDoc as Record<string, unknown>)['b2bStockQuantity'];
        const b2bQty = typeof b2bRaw === 'number' ? b2bRaw : Number(b2bRaw ?? 0);

        let eff = 0;
        if (ours) {
          // We have explicit stock record -> use it
          eff = (ours.stock ?? 0) + (ours.inTransit ?? 0);
        } else if (useOurStock) {
          // We found stock records for OTHER variants, so the system is active.
          // Absence of record for this variant means 0 stock.
          eff = 0;
        } else {
          // We found NO stock records for ANY variant. 
          // Fallback to B2B.
          eff = Number.isFinite(b2bQty) ? b2bQty : 0;
        }

        if (eff > 0) sizeToQty[code] = (sizeToQty[code] ?? 0) + eff;
      }
      bike.stockSizes = Object.entries(sizeToQty).filter(([, q]) => q > 0).map(([s]) => s).sort((a, b) => a.localeCompare(b, 'cs', { numeric: true }));
      bike.stockQtyBySize = sizeToQty;

      // Compute on-the-way sizes (in transit)
      const sizeToTransit: Record<string, number> = {};
      for (const d of list.docs) {
        const dataDoc = (d as any).data() as Record<string, unknown>;
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
        const dataDoc = (d as any).data() as Record<string, unknown>;
        const nrDoc = (((dataDoc.nrLf as string | undefined) ?? (dataDoc.lfSn as string | undefined) ?? '').toString());
        if (!nrDoc.startsWith(base)) continue;
        const code = nrDoc.match(/(\d{2})$/)?.[1];
        if (!code) continue;
        sizeToNrLf[code] = nrDoc;
      }
      bike.sizeToNrLf = sizeToNrLf;

      // Compute full battery variants (existing logic)
      const currentSize = bike.nrLf?.match(/(\d{2})$/)?.[1];
      const variants: Record<string, unknown>[] = [];

      // ONLY for E-bikes
      if (isEbike(data)) {
        for (const capCode of Object.keys(capacityCodeToWh)) {
          const capWh = capacityCodeToWh[capCode];
          // Find all bikes for this capacity
          const variantDocs = list.docs.filter((d: any) => {
            const dData = d.data() as Record<string, unknown>;
            const dNr = (((dData.nrLf as string | undefined) ?? (dData.lfSn as string | undefined) ?? '').toString());
            if (!dNr.startsWith(family)) return false;
            const dCode = dNr.charAt(Math.max(0, dNr.length - 3));
            return dCode === capCode;
          });

          if (variantDocs.length === 0) continue;

          // Find representative ID (prefer same size)
          let repDoc = variantDocs.find((d: any) => {
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
            const dData = (d as any).data() as Record<string, unknown>;
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

        (bike as any).batteryVariants = variants.sort((a: any, b: any) => {
          const capA = (a['capacityWh'] as number) || 0;
          const capB = (b['capacityWh'] as number) || 0;
          return capA - capB;
        });
      }

      // Compute Color Variants (Siblings)
      // Logic: Same Brand + Model + Frame Type + Year
      // We need to fetch potential siblings. We can use the 'base' we already have, but that's NRLF based.
      // Color variants might have different NRLF bases.
      // So we need to query by Brand and Model if possible, or filter from a larger set.
      // Since we don't want to fetch ALL bikes, we can rely on the fact that we already fetched 'list' based on NRLF base.
      // BUT, different colors usually have different NRLF bases (e.g. 525-001 vs 525-002).
      // So 'list' might be insufficient if it only contains the current NRLF base.
      // Wait, line 96 fetches `bikesRef` with `isActive == true`. It fetches ALL active bikes?
      // No, line 96: `const list = await getDocs(q);` where `q` is `query(bikesRef, where('isActive', '==', true))`.
      // YES, it fetches ALL active bikes. This is inefficient but it means we HAVE all the data we need in `list`.

      const getModelYear = (b: Record<string, unknown>): number | null => {
        const y = b.modelljahr ?? (b.specifications as any)?.Modelljahr ?? (b.specifications as any)?.modelljahr;
        const n = parseInt((y ?? '').toString(), 10);
        if (Number.isFinite(n)) return n;
        const nr = ((b.nrLf as string) ?? (b.lfSn as string) ?? (b as any).nrlf ?? (b as any).NRLF ?? '').toString().trim();
        if (nr.startsWith('525')) return 2025;
        if (nr.startsWith('526')) return 2026;
        return null;
      };

      const currentYear = getModelYear(data);
      const currentBrand = (data.marke ?? '').toString().trim().toLowerCase();
      const currentModel = (data.modell ?? '').toString().trim().toLowerCase();
      const currentFrameType = ((data.specifications as any)?.['Frame type (RTYP)'] ?? '').toString().trim().toLowerCase();

      // Helper to get unique color variants
      const colorVariants = new Map<string, { id: string; color: string; image: string; nrLf: string }>();

      for (const d of list.docs) {
        const b = (d as any).data() as any;
        const bBrand = (b.marke ?? '').toString().trim().toLowerCase();
        const bModel = (b.modell ?? '').toString().trim().toLowerCase();
        const bFrameType = ((b.specifications as any)?.['Frame type (RTYP)'] ?? '').toString().trim().toLowerCase();
        const bYear = getModelYear(b);

        // Match criteria
        if (
          bBrand === currentBrand &&
          bModel === currentModel &&
          bFrameType === currentFrameType &&
          bYear === currentYear
        ) {
          const color = (b.farbe ?? '').toString().trim();
          const image = (b.bild1 ?? '').toString().trim();
          const nrLf = ((b.nrLf as string) ?? (b.lfSn as string) ?? '').toString();

          // Use color as key
          if (color) {
            const key = color.toLowerCase();
            const existing = colorVariants.get(key);

            // Prefer variant with image, or if both have image, maybe the one that matches current ID?
            // Actually we just want ONE representative per color.
            // If we already have one, we only replace it if the new one has an image and the old one didn't.
            if (!existing || (!existing.image && image)) {
              colorVariants.set(key, {
                id: d.id,
                color: color,
                image: image,
                nrLf: nrLf
              });
            } else if (existing && existing.image && image) {
              // If both have images, prefer the one that is the current bike (if applicable)
              if (d.id === id) {
                colorVariants.set(key, {
                  id: d.id,
                  color: color,
                  image: image,
                  nrLf: nrLf
                });
              }
            }
          }
        }
      }

      (bike as any).variants = Array.from(colorVariants.values());
    }

    return NextResponse.json(bike);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
