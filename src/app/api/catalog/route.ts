/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface RawBike {
  id: string;
  marke?: string;
  modell?: string;
  nrLf?: string;
  lfSn?: string;
  bild1?: string;
  farbe?: string;
  specifications?: Record<string, unknown>;
  [key: string]: unknown;
}

// Simple in-memory cache to speed up repeated requests
type AggregatedCache = {
  expiresAt: number;
  aggregated: any[];
  categories: string[];
  sizeOptions: string[];
};
let CATALOG_CACHE: AggregatedCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const search = (searchParams.get('search') || '').toLowerCase();
    const category = (searchParams.get('category') || '').toLowerCase();
    const sizeFilter = (searchParams.get('size') || '').trim();
    const refresh = searchParams.get('refresh') === 'true';
    const ebikeParam = searchParams.get('ebike'); // 'true' | 'false' | null
    const inStockParam = searchParams.get('inStock'); // 'true' | null

    const moseParam = searchParams.get('mose'); // Model Series filter

    // Helpers used throughout this handler
    const PLACEHOLDER = 'unknown manual entry required';
    const PLACEHOLDER_TOKENS = new Set(['unknown', 'manual entry required']);
    const getCategory = (b: any): string => {
      const fromTopLevel =
        b['Category (PRGR)'] ?? b['Categorie (PRGR)'] ?? b.categoryPrgr ?? b.categoriePrgr;
      const fromSpecs =
        b.specifications?.['Category (PRGR)'] ??
        b.specifications?.['Categorie (PRGR)'] ??
        b.specifications?.categoryPrgr ??
        b.specifications?.categoriePrgr;
      const val = (fromTopLevel ?? fromSpecs ?? '').toString().trim();
      return val.toLowerCase() === PLACEHOLDER ? '' : val;
    };
    const getMose = (b: any): string => {
      const val = (b.specifications?.['Model series (MOSE)'] ?? '').toString().trim();
      return val.toLowerCase() === PLACEHOLDER ? '' : val;
    };

    const isEbike = (b: any): boolean => {
      if (typeof (b as any).isEbike === 'boolean') {
        return (b as any).isEbike as boolean;
      }
      const cat = getCategory(b).toLowerCase();
      const spec = (b.specifications ?? {}) as Record<string, unknown>;
      const drive = (spec['Antriebsart (MOTO)'] ?? '').toString().toLowerCase();
      const motor = (spec['Motor (MOTM)'] ?? spec['Motor (MOTO)'] ?? b.motor ?? '')
        .toString()
        .toLowerCase();
      const battery = (
        spec['Akku (AKKU)'] ??
        spec['Akkumodell (AKKU)'] ??
        spec['Battery (Wh) (AKLW)'] ??
        b.akku ??
        ''
      )
        .toString()
        .toLowerCase();
      const modelName = (b.modell ?? '').toString().toLowerCase();
      // Heuristics: explicit E- category, drive mentions elektro, known motor/battery fields present,
      // model names often start with 'e-' or contain 'e-stream'
      return (
        cat.startsWith('e-') ||
        drive.includes('elektro') ||
        motor.length > 0 ||
        battery.length > 0 ||
        modelName.startsWith('e-') ||
        modelName.includes('e-stream')
      );
    };
    const mapRawToTag = (raw: string, isE: boolean): string | null => {
      const r = raw.trim();
      if (!r) return null;
      if (isE) {
        if (r === 'E-ATB Hardtail' || r === 'E-MTB hardtail') return 'Hardtail';
        if (r === 'E-MTB Fully') return 'Celopéra';
        if (r === 'E-SUV Fully / E-ATB Fully') return 'SUV Celopéra';
        if (r === 'E-city / E-trekking' || r === 'Trekking & City') return 'Trekking';
        if (r === 'E-urban') return 'Město';
        if (r === 'E-Gravelbike / E-Cyclocross') return 'Gravel';
        if (r === 'E-youth bike') return 'Mládež';
        // r === 'E-speed' and others not listed -> hide
        return null;
      } else {
        if (r === 'ATB / SUV' || r === 'Cross' || r === 'Cross Street' || r === 'Trekking & City') return 'SUV/Trekking';
        if (r === 'Gravelbike / Cyclocross') return 'Gravel';
        if (r === "Children's bike") return 'Dětské';
        if (r === 'MTB hardtail') return 'Hardtail';
        if (r === 'MTB Fully') return 'Celopéra';
        if (r === 'Racing bike') return 'Silnice';
        if (r === 'Youth bike' || r === 'BMX') return 'Mládež';
        return null;
      }
    };
    const getMappedCategory = (b: any, ebikeParam: string | null): string | null => {
      const raw = getCategory(b);
      const mapped = mapRawToTag(raw, ebikeParam === 'true' ? true : ebikeParam === 'false' ? false : isEbike(b));
      return mapped;
    };

    // Price helpers (MOC in CZK). We try a set of common keys and also scan specification keys.
    const toNumberFromMixed = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
      if (!s) return null;
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };
    const PRICE_KEYS = ['moc', 'MOC', 'mocCzk', 'mocCZK', 'priceCzk', 'priceCZK', 'price', 'cena', 'Cena', 'uvp', 'UVP', 'UPE', 'uvpCZK'];
    const getMocCzk = (b: any): number | null => {
      for (const k of PRICE_KEYS) {
        const n = toNumberFromMixed((b as any)[k]);
        if (n != null) return n;
      }
      const spec = (b?.specifications ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(spec)) {
        if (/moc|uvp|price|cena/i.test(k)) {
          const n = toNumberFromMixed(spec[k]);
          if (n != null) return n;
        }
      }
      return null;
    };
    // Dealer tier prices (A–F) are intentionally not exposed in the public API.

    // Compute or reuse aggregated list (with sizes), categories, and size options
    let aggregated: RawBike[];
    let sizeOptions: string[];

    const now = Date.now();
    // Year handling
    const getModelYear = (b: RawBike): number | null => {
      const y = b.modelljahr ?? b.specifications?.Modelljahr ?? b.specifications?.modelljahr;
      const n = parseInt((y ?? '').toString(), 10);
      return Number.isFinite(n) ? n : null;
    };
    const yearRaw = searchParams.get('year');
    const yearParam = yearRaw && yearRaw.trim() !== '' && !Number.isNaN(parseInt(yearRaw, 10))
      ? parseInt(yearRaw, 10)
      : null;

    if (!CATALOG_CACHE || CATALOG_CACHE.expiresAt < now || refresh) {
      const bikesRef = collection(db, 'bikes');
      const q = query(bikesRef, where('isActive', '==', true));
      const snap = await getDocs(q);
      const items: RawBike[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as RawBike[];
      // Optionally load our stock list (biketime). If not present, we will fallback to B2B quantities.
      const stockSnap = await getDocs(collection(db, 'stock'));
      const rawStock = stockSnap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      const useOurStock = rawStock.length > 0;
      const toNum = (v: unknown): number => {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        const s = String(v ?? '').replace(/[^0-9.-]/g, '');
        const n = Number(s || '0');
        return Number.isFinite(n) ? n : 0;
      };
      const nrToStock: Record<string, { stock: number; inTransit: number }> = {};
      if (useOurStock) {
        for (const s of rawStock) {
          const key = ((s as any).nrLf ?? (s as any).nrlf ?? (s as any).id ?? '').toString().trim();
          if (!key) continue;
          nrToStock[key] = {
            stock: toNum((s as any).stock ?? (s as any).qty ?? (s as any).onHand ?? 0),
            inTransit: toNum((s as any).inTransit ?? (s as any).in_transit ?? (s as any).incoming ?? 0),
          };
        }
      }
      const yearOptions = Array.from(new Set(items.map(getModelYear).filter((n): n is number => !!n))).sort((a, b) => b - a);

      // Build list of unique categories for UI dropdown

      const categoriesComputed = Array.from(new Set(
        items
          .map(getCategory)
          .filter((v: string) => v.length > 0 && v.toLowerCase() !== PLACEHOLDER)
      ))
        .sort((a, b) => a.localeCompare(b, 'cs', { sensitivity: 'base' }));

      // Note: filtering by search/category happens later on the cached aggregated list

      // Primary sort by category (Category/Categorie (PRGR)), then by brand and model
      items.sort((a: RawBike, b: RawBike) => {
        const aCat = getCategory(a);
        const bCat = getCategory(b);
        const catCmp = aCat.localeCompare(bCat, 'cs', { sensitivity: 'base' });
        if (catCmp !== 0) return catCmp;
        const aBrand = (a.marke ?? '').toString();
        const bBrand = (b.marke ?? '').toString();
        const brandCmp = aBrand.localeCompare(bBrand, 'cs', { sensitivity: 'base' });
        if (brandCmp !== 0) return brandCmp;
        const aModel = (a.modell ?? '').toString();
        const bModel = (b.modell ?? '').toString();
        return aModel.localeCompare(bModel, 'cs', { sensitivity: 'base' });
      });

      // Merge sizes: group by NRLF base (NRLF without last two digits); collect sizes from last two digits
      const getNrLf = (b: RawBike): string => (b.nrLf ?? b.lfSn ?? (b as any).nrlf ?? (b as any).NRLF ?? '').toString().trim();
      const getBaseAndSize = (nr: string): { base: string; size?: string } => {
        const m = nr.match(/^(.*?)(\d{2})$/);
        if (!m) return { base: nr || '', size: undefined };
        return { base: m[1], size: m[2] };
      };

      // Battery capacity helpers
      const capacityCodeToWh: Record<string, number> = { '9': 900, '8': 800, '7': 750, '6': 600, '5': 500, '4': 400 };
      const parseCapacityFromText = (text?: unknown): number | null => {
        const s = (text ?? '').toString();
        const m = s.match(/(\d{3,4})\s*wh/i);
        return m ? parseInt(m[1], 10) : null;
      };
      const getCapacityWh = (b: RawBike): number | null => {
        // try from known fields
        const fromFields =
          parseCapacityFromText(b.akku) ||
          parseCapacityFromText(b.specifications?.Akku) ||
          parseCapacityFromText(b.specifications?.['Akkumodell (AKKU)']) ||
          parseCapacityFromText(b.specifications?.['Akku (AKKU)']);
        if (fromFields) return fromFields;
        // Only infer from NRLF for E-bikes; non‑E bikes should not get capacities
        if (!isEbike(b)) return null;
        // fallback to NRLF third digit from right
        const nr = getNrLf(b);
        if (nr.length >= 3) {
          const code = nr.charAt(nr.length - 3);
          if (capacityCodeToWh[code]) return capacityCodeToWh[code];
        }
        return null;
      };
      const getFamilyKey = (b: RawBike): string => {
        const nr = getNrLf(b);
        // Group by NRLF base = NRLF without the last two digits (size code)
        const m = nr.match(/^(.*?)(\d{2})$/);
        if (!m) return nr;
        const base = m[1];

        // For E-bikes, if the digit before size is a known battery code, strip it too
        // so that e.g. ...644 (600Wh) and ...744 (750Wh) group together.
        if (isEbike(b)) {
          const batteryCode = base.slice(-1);
          if (capacityCodeToWh[batteryCode]) {
            return base.slice(0, -1);
          }
        }
        return base;
      };

      const familyToGroup: Record<string, { representative: RawBike; sizes: string[]; capacitiesWh: number[]; items: RawBike[]; stockQty: number; stockSizes: Set<string>; transitQty: number; transitSizes: Set<string> }> = {};
      for (const it of items) {
        const nr = getNrLf(it);
        const { size } = getBaseAndSize(nr);
        const family = getFamilyKey(it);
        if (!familyToGroup[family]) {
          familyToGroup[family] = { representative: it, sizes: [], capacitiesWh: [], items: [], stockQty: 0, stockSizes: new Set<string>(), transitQty: 0, transitSizes: new Set<string>() };
        }
        familyToGroup[family].items.push(it);
        if (size) {
          if (!familyToGroup[family].sizes.includes(size)) familyToGroup[family].sizes.push(size);
        }
        // Accumulate stock:
        // - Prefer OUR stock list when present (stock + inTransit)
        // - Otherwise fallback to B2B stock only
        const oursMaybe = useOurStock ? ((nrToStock as any)[nr] as { stock?: number; inTransit?: number } | undefined) : undefined;
        const oursQty = (oursMaybe?.stock ?? 0) + (oursMaybe?.inTransit ?? 0);
        const b2bQty = Number((it as any).b2bStockQuantity ?? 0);
        const effectiveQty = useOurStock ? (Number.isFinite(oursQty) ? oursQty : 0) : (Number.isFinite(b2bQty) ? b2bQty : 0);
        if (effectiveQty > 0) {
          familyToGroup[family].stockQty += effectiveQty;
          if (size) familyToGroup[family].stockSizes.add(size);
        }
        // Track in-transit quantities:
        // - Only from our stock list when present (authoritative)
        // - Ignore supplier B2B shipping to avoid false positives
        const oursTransit = useOurStock ? Number(((nrToStock as any)[nr]?.inTransit) ?? 0) : 0;
        const effectiveTransit = useOurStock ? (Number.isFinite(oursTransit) ? oursTransit : 0) : 0;
        if (effectiveTransit > 0) {
          familyToGroup[family].transitQty += effectiveTransit;
          if (size) familyToGroup[family].transitSizes.add(size);
        }
        const cap = getCapacityWh(it);
        if (cap) {
          if (!familyToGroup[family].capacitiesWh.includes(cap)) familyToGroup[family].capacitiesWh.push(cap);
        }
        // pick representative: prefer having image, then higher capacity
        const current = familyToGroup[family].representative;
        const currentCap = getCapacityWh(current) ?? 0;
        const itCap = cap ?? 0;
        if ((!current?.bild1 && it.bild1) || itCap > currentCap) {
          familyToGroup[family].representative = it;
        }
      }

      // Build aggregated list preserving previous sort order by mapping to group order
      const seen = new Set<string>();
      const aggregatedComputed: RawBike[] = [];
      for (const it of items) {
        const nr = getNrLf(it);
        const family = getFamilyKey(it);
        const key = family || nr || it.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const group = familyToGroup[key];
        // After we know stockSizes, prefer representative that is actually in stock (by size) if available
        const pickInStockRepresentative = (): RawBike => {
          const inStockCheck = (nrCode: string, item: RawBike): boolean => {
            const oursMaybe2 = useOurStock ? ((nrToStock as any)[nrCode] as { stock?: number; inTransit?: number } | undefined) : undefined;
            const oursQty2 = (oursMaybe2?.stock ?? 0) + (oursMaybe2?.inTransit ?? 0);
            const b2bQty2 = Number(((item as any).b2bStockQuantity ?? 0));
            const eff = useOurStock ? (Number.isFinite(oursQty2) ? oursQty2 : 0) : (Number.isFinite(b2bQty2) ? b2bQty2 : 0);
            return eff > 0;
          };
          const firstInStock = group.items.find(candidate => inStockCheck(getNrLf(candidate), candidate));
          return (firstInStock ?? group.representative) as RawBike;
        };
        // Prefer a representative that matches the search query's NRLF (if provided),
        // otherwise fall back to the first in‑stock variant, otherwise the existing representative.
        const pickSearchOrInStockRepresentative = (): RawBike => {
          // If user typed a code, prefer the exact family member whose NRLF matches the query
          if (search && search.length > 0) {
            const codeHit = group.items.find(candidate =>
              getNrLf(candidate).toLowerCase().includes(search)
            );
            if (codeHit) return codeHit as RawBike;
          }
          return pickInStockRepresentative();
        };
        const representative = pickSearchOrInStockRepresentative();
        const rep: RawBike & { sizes?: string[]; capacitiesWh?: number[] } = { ...(representative as RawBike) } as RawBike & { sizes?: string[]; capacitiesWh?: number[] };
        rep.sizes = group.sizes.sort((a: string, b: string) => a.localeCompare(b, 'cs', { numeric: true }));
        rep.capacitiesWh = group.capacitiesWh.sort((a: number, b: number) => a - b);
        // Expose OUR stock as the public in-stock flags to UI using existing property names
        (rep as any).b2bStockQuantity = group.stockQty;
        (rep as any).stockSizes = Array.from(group.stockSizes).sort((a: string, b: string) => a.localeCompare(b, 'cs', { numeric: true }));
        // Attach full list of family NRLFs for accurate search by code
        (rep as any).allNrLfs = group.items.map(g => getNrLf(g)).filter(Boolean);
        // Attach in-transit sizes and total
        (rep as any).onTheWaySizes = Array.from(group.transitSizes).sort((a: string, b: string) => a.localeCompare(b, 'cs', { numeric: true }));
        (rep as any).inTransitQty = group.transitQty;
        // Attach MOC price (CZK) for the representative.
        // Prefer an explicitly stored CZK MOC (e.g., 'mocCzk' after import) from any item in the family.
        const explicitFromFamily = group.items
          .map((it) => toNumberFromMixed((it as any)['mocCzk']))
          .find((p) => p != null);
        if (explicitFromFamily != null) {
          (rep as any).mocCzk = explicitFromFamily;
        } else {
          // Otherwise derive from common keys/specs for any bike
          const priceFromFamily = group.items.map(getMocCzk).find((p) => p != null);
          if (priceFromFamily != null) (rep as any).mocCzk = priceFromFamily;
        }
        // Do not attach dealer tiers to public response
        const repIsE = isEbike(rep);
        if (!repIsE) {
          // Ensure non‑E bikes do not show battery capacities
          rep.capacitiesWh = [];
        }
        // sanitize placeholder titles
        const clean = (v?: string) => {
          const s = (v ?? '').toString().trim();
          const lower = s.toLowerCase();
          if (lower === PLACEHOLDER) return '';
          if (PLACEHOLDER_TOKENS.has(lower)) return '';
          return s;
        };
        rep.marke = clean(rep.marke);
        rep.modell = clean(rep.modell);
        // Workaround: hide 2022/2023/2024 models unless in stock or in transit
        const repYear = getModelYear(rep as RawBike);
        const isOldYear = repYear === 2022 || repYear === 2023 || repYear === 2024;
        const qty = Number(((rep as any).b2bStockQuantity ?? 0)) || 0;
        const inTransit = Number(((rep as any).inTransitQty ?? 0)) || 0;
        if (isOldYear && qty <= 0 && inTransit <= 0) {
          continue;
        }
        // skip entries with no usable title
        if ((rep.marke ?? '') === '' && (rep.modell ?? '') === '') {
          continue;
        }
        // Create lean payload to reduce response size while preserving needed fields
        const leanRep: any = {
          id: rep.id,
          marke: rep.marke,
          modell: rep.modell,
          nrLf: getNrLf(rep),
          lfSn: rep.lfSn,
          bild1: (rep as any).bild1,
          farbe: rep.farbe,
          sizes: rep.sizes,
          capacitiesWh: rep.capacitiesWh,
          b2bStockQuantity: (rep as any).b2bStockQuantity,
          stockSizes: (rep as any).stockSizes,
          allNrLfs: (rep as any).allNrLfs,
          onTheWaySizes: (rep as any).onTheWaySizes,
          inTransitQty: (rep as any).inTransitQty,
          mocCzk: (rep as any).mocCzk,
          isEbike: repIsE,
          categoryPrgr: getCategory(rep),
          modelljahr: getModelYear(rep as RawBike),
          mose: getMose(rep),
        };
        aggregatedComputed.push(leanRep);
      }

      // If no specific year or e‑bike filter is requested, prefer showing E‑bikes first,
      // and within each group prefer 2026 models first.
      if (yearParam === null && ebikeParam == null) {
        aggregatedComputed.sort((a: RawBike, b: RawBike) => {
          const ae = isEbike(a) ? 1 : 0;
          const be = isEbike(b) ? 1 : 0;
          if (ae !== be) return be - ae; // E‑bikes first
          const ya = getModelYear(a);
          const yb = getModelYear(b);
          const aIs2026 = ya === 2026 ? 1 : 0;
          const bIs2026 = yb === 2026 ? 1 : 0;
          if (aIs2026 !== bIs2026) return bIs2026 - aIs2026; // put 2026 first
          return 0;
        });
      }

      // Compute global size options from aggregated list
      const sizeOptionsComputed = Array.from(
        new Set(aggregatedComputed.flatMap((g: any) => (Array.isArray(g.sizes) ? g.sizes : [])))
      ).sort((a: string, b: string) => a.localeCompare(b, 'cs', { numeric: true }));

      CATALOG_CACHE = {
        expiresAt: Date.now() + CACHE_TTL_MS,
        aggregated: aggregatedComputed,
        categories: categoriesComputed,
        sizeOptions: sizeOptionsComputed,
      };
      aggregated = aggregatedComputed;
      sizeOptions = sizeOptionsComputed;
      // Attach yearOptions temporarily to global to return later via closure
      (globalThis as any).__BT_YEAR_OPTIONS__ = yearOptions;
    } else {
      aggregated = CATALOG_CACHE.aggregated;
      sizeOptions = CATALOG_CACHE.sizeOptions;
    }

    // Optional filter by year, then size
    // Apply filters on cached aggregated list (lean objects)
    let afterFilters = aggregated;
    if (yearParam !== null) {
      afterFilters = afterFilters.filter((b: any) => Number((b as any).modelljahr ?? 0) === yearParam);
    }
    if (search) {
      afterFilters = afterFilters.filter((b: any) => {
        const s = search;
        const matchesBasic =
          (b.marke || '').toLowerCase().includes(s) ||
          (b.modell || '').toLowerCase().includes(s) ||
          (b.nrLf || '').toLowerCase().includes(s) ||
          (b.farbe || '').toLowerCase().includes(s);
        const allCodes: string[] = Array.isArray((b as any).allNrLfs) ? ((b as any).allNrLfs as string[]) : [];
        const matchesCodes = allCodes.some(code => code.toLowerCase().includes(s));
        return matchesBasic || matchesCodes;
      });
    }
    if (category) {
      afterFilters = afterFilters.filter((b: any) => {
        const mapped = (getMappedCategory(b, ebikeParam) || '').toLowerCase();
        return mapped === category.toLowerCase();
      });
    }
    if (ebikeParam === 'true') {
      afterFilters = afterFilters.filter((b: any) => isEbike(b));
    } else if (ebikeParam === 'false') {
      afterFilters = afterFilters.filter((b: any) => !isEbike(b));
    }
    if (sizeFilter) {
      afterFilters = afterFilters.filter((g: any) => (g.sizes || []).includes(sizeFilter));
    }

    if (inStockParam === 'true') {
      afterFilters = afterFilters.filter((g: any) => Number((g as any).b2bStockQuantity ?? 0) > 0);
    }

    // Compute Model Series options based on current filters (excluding mose filter itself)
    const moseOptions = Array.from(new Set(
      afterFilters
        .map((b: any) => b.mose)
        .filter((v: string) => v && v.length > 0)
    )).sort((a: any, b: any) => a.localeCompare(b, 'cs', { sensitivity: 'base' }));

    // Apply Model Series filter
    if (moseParam) {
      afterFilters = afterFilters.filter((b: any) => (b.mose || '').toLowerCase() === moseParam.toLowerCase());
    }

    // Categories should reflect the active filters EXCEPT the selected category
    let categorySource = aggregated;
    if (yearParam !== null) {
      categorySource = categorySource.filter((b: any) => Number((b as any).modelljahr ?? 0) === yearParam);
    }
    if (search) {
      categorySource = categorySource.filter((b: any) => {
        const s = search;
        const matchesBasic =
          (b.marke || '').toLowerCase().includes(s) ||
          (b.modell || '').toLowerCase().includes(s) ||
          (b.nrLf || '').toLowerCase().includes(s) ||
          (b.farbe || '').toLowerCase().includes(s);
        const allCodes: string[] = Array.isArray((b as any).allNrLfs) ? ((b as any).allNrLfs as string[]) : [];
        const matchesCodes = allCodes.some(code => code.toLowerCase().includes(s));
        return matchesBasic || matchesCodes;
      });
    }
    if (ebikeParam === 'true') {
      categorySource = categorySource.filter((b: any) => isEbike(b));
    } else if (ebikeParam === 'false') {
      categorySource = categorySource.filter((b: any) => !isEbike(b));
    }
    if (sizeFilter) {
      categorySource = categorySource.filter((g: any) => (g.sizes || []).includes(sizeFilter));
    }
    if (inStockParam === 'true') {
      categorySource = categorySource.filter((g: any) => Number((g as any).b2bStockQuantity ?? 0) > 0);
    }
    if (moseParam) {
      categorySource = categorySource.filter((b: any) => (b.mose || '').toLowerCase() === moseParam.toLowerCase());
    }

    const categoriesForResponse = Array.from(
      new Set(
        categorySource
          .map((b: any) => getMappedCategory(b, ebikeParam))
          .filter((v: string | null) => !!v)
      )
    ).sort((a, b) => (a as string).localeCompare(b as string, 'cs', { sensitivity: 'base' })) as string[];

    const total = afterFilters.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const bikes = afterFilters.slice(start, end);
    return NextResponse.json(
      {
        bikes,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        categories: categoriesForResponse,
        sizeOptions,
        yearOptions: ((globalThis as any).__BT_YEAR_OPTIONS__ as number[] | undefined) || [],
        moseOptions,
      },
      {
        headers: {
          // stronger CDN cache with graceful SWR
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=900',
        },
      }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}



