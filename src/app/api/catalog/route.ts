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
let LAST_YEAR: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '48');
    const search = (searchParams.get('search') || '').toLowerCase();
    const category = (searchParams.get('category') || '').toLowerCase();
    const sizeFilter = (searchParams.get('size') || '').trim();
    const refresh = searchParams.get('refresh') === 'true';
    const ebikeParam = searchParams.get('ebike'); // 'true' | 'false' | null

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
    const isEbike = (b: any): boolean => {
      const cat = getCategory(b).toLowerCase();
      const drive = (b.specifications?.['Antriebsart (MOTO)'] ?? '')
        .toString()
        .toLowerCase();
      return cat.startsWith('e-') || drive.includes('elektro');
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

    // Compute or reuse aggregated list (with sizes), categories, and size options
    let aggregated: RawBike[];
    let categories: string[];
    let sizeOptions: string[];

    const now = Date.now();
    // Year handling
    const getModelYear = (b: RawBike): number | null => {
      const y = b.modelljahr ?? b.specifications?.Modelljahr ?? b.specifications?.modelljahr;
      const n = parseInt((y ?? '').toString(), 10);
      return Number.isFinite(n) ? n : null;
    };
    const yearParam = parseInt((searchParams.get('year') || '2026').toString(), 10);

    if (!CATALOG_CACHE || CATALOG_CACHE.expiresAt < now || refresh || LAST_YEAR !== yearParam) {
      const bikesRef = collection(db, 'bikes');
      const q = query(bikesRef, where('isActive', '==', true));
      const snap = await getDocs(q);
      let items: RawBike[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as RawBike[];
      const yearOptions = Array.from(new Set(items.map(getModelYear).filter((n): n is number => !!n))).sort((a,b)=>b-a);
      items = items.filter((b: any) => getModelYear(b) === yearParam);

    // Build list of unique categories for UI dropdown

      const categoriesComputed = Array.from(new Set(
        items
          .map(getCategory)
          .filter((v: string) => v.length > 0 && v.toLowerCase() !== PLACEHOLDER)
      ))
        .sort((a, b) => a.localeCompare(b, 'cs', { sensitivity: 'base' }));

    let filtered = items;
    if (search) {
      filtered = items.filter(b =>
        (b.marke || '').toLowerCase().includes(search) ||
        (b.modell || '').toLowerCase().includes(search) ||
        (b.nrLf || '').toLowerCase().includes(search) ||
        (b.farbe || '').toLowerCase().includes(search)
      );
    }

    if (category) {
      filtered = filtered.filter((b: any) => getCategory(b).toLowerCase() === category);
    }

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
    const getFamilyKey = (nr: string): string => {
      const m = nr.match(/^(.*?)(\d{3})$/);
      return m ? m[1] : nr;
    };

    const familyToGroup: Record<string, { representative: RawBike; sizes: string[]; capacitiesWh: number[]; items: RawBike[] }> = {};
    for (const it of items) {
      const nr = getNrLf(it);
      const { size } = getBaseAndSize(nr);
      const family = getFamilyKey(nr);
      if (!familyToGroup[family]) {
        familyToGroup[family] = { representative: it, sizes: [], capacitiesWh: [], items: [] };
      }
      familyToGroup[family].items.push(it);
      if (size) {
        if (!familyToGroup[family].sizes.includes(size)) familyToGroup[family].sizes.push(size);
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
        const family = getFamilyKey(nr);
        const key = family || nr || it.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const group = familyToGroup[key];
      const rep: RawBike & { sizes?: string[]; capacitiesWh?: number[] } = { ...(group.representative as RawBike) } as RawBike & { sizes?: string[]; capacitiesWh?: number[] };
        rep.sizes = group.sizes.sort((a: string, b: string) => a.localeCompare(b, 'cs', { numeric: true }));
        rep.capacitiesWh = group.capacitiesWh.sort((a: number, b: number) => a - b);
        if (!isEbike(rep)) {
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
      // skip entries with no usable title
      if ((rep.marke ?? '') === '' && (rep.modell ?? '') === '') {
        continue;
      }
        aggregatedComputed.push(rep);
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
      LAST_YEAR = yearParam;
      aggregated = aggregatedComputed;
      categories = categoriesComputed;
      sizeOptions = sizeOptionsComputed;
      // Attach yearOptions temporarily to global to return later via closure
      (globalThis as any).__BT_YEAR_OPTIONS__ = yearOptions;
    } else {
      aggregated = CATALOG_CACHE.aggregated;
      categories = CATALOG_CACHE.categories;
      sizeOptions = CATALOG_CACHE.sizeOptions;
    }

    // Optional filter by size
    // Apply filters on cached aggregated list
    let afterFilters = aggregated;
    if (search) {
      afterFilters = afterFilters.filter((b: any) =>
        (b.marke || '').toLowerCase().includes(search) ||
        (b.modell || '').toLowerCase().includes(search) ||
        (b.nrLf || '').toLowerCase().includes(search) ||
        (b.farbe || '').toLowerCase().includes(search)
      );
    }
    if (category) {
      afterFilters = afterFilters.filter((b: any) => {
        const mapped = (getMappedCategory(b, ebikeParam) || '').toLowerCase();
        return mapped === category.toLowerCase();
      });
    }
    if (ebikeParam === 'true') {
      afterFilters = afterFilters.filter((b: any) => {
        const cat = getCategory(b).toLowerCase();
        return cat.startsWith('e-') || (b.specifications?.['Antriebsart (MOTO)'] ?? '').toString().toLowerCase().includes('elektro');
      });
    } else if (ebikeParam === 'false') {
      afterFilters = afterFilters.filter((b: any) => {
        const cat = getCategory(b).toLowerCase();
        const isE = cat.startsWith('e-') || (b.specifications?.['Antriebsart (MOTO)'] ?? '').toString().toLowerCase().includes('elektro');
        return !isE;
      });
    }
    if (sizeFilter) {
      afterFilters = afterFilters.filter((g: any) => (g.sizes || []).includes(sizeFilter));
    }

    // Categories should reflect the E-bike toggle selection
    let categoriesResponseSource = aggregated;
    if (ebikeParam === 'true') categoriesResponseSource = aggregated.filter(isEbike);
    else if (ebikeParam === 'false') categoriesResponseSource = aggregated.filter((b: any) => !isEbike(b));
    const categoriesForResponse = Array.from(
      new Set(
        categoriesResponseSource
          .map((b: any) => getMappedCategory(b, ebikeParam))
          .filter((v: string | null) => !!v)
      )
    ).sort((a, b) => (a as string).localeCompare(b as string, 'cs', { sensitivity: 'base' })) as string[];

    const total = afterFilters.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const bikes = afterFilters.slice(start, end);
    return NextResponse.json({
      bikes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      categories: categoriesForResponse,
      sizeOptions,
      yearOptions: ((globalThis as any).__BT_YEAR_OPTIONS__ as number[] | undefined) || [2026],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}



