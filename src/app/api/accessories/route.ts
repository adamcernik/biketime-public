import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs } from 'firebase/firestore';

export interface AccessoryDoc {
  id: string;
  lfSn?: string;
  nrLf?: string;
  ean?: string;
  produkt?: string;
  marke?: string;
  modell?: string;
  spezifikation?: string;
  hersteller?: string;
  farbe?: string;
  modelljahr?: number | null;
  ekPl?: number | null;
  uvpPl?: number | null;
  uavpPl?: number | null;
  image?: string;
  imageTransparent?: string;
  imageDetail1?: string;
  imageDetail2?: string;
  imageDetail3?: string;
  productType?: string;
  categorie?: string;
  category?: string; // constant: Accessories
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qSearch = (searchParams.get('search') ?? '').toLowerCase();
  const qBrand = searchParams.get('brand') ?? '';
  const qYear = searchParams.get('year') ?? '';
  const qType = searchParams.get('productType') ?? '';
  const qCategorie = searchParams.get('categorie') ?? '';
  const qGroup = (searchParams.get('group') ?? '').toLowerCase();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);

  const snap = await getDocs(collection(db, 'accessories'));
  const all: AccessoryDoc[] = snap.docs.map((d) => {
    const data = d.data() as Omit<AccessoryDoc, 'id'>;
    return { id: d.id, ...data };
  });

  // Compute global list of unique product types (for fixed chips)
  const allTypes = Array.from(
    new Set(all.map((a) => a.productType).filter(Boolean))
  ) as string[];

  const mapToGroup = (a: AccessoryDoc): string => {
    const t = (a.productType ?? '').toLowerCase();
    const c = (a.categorie ?? '').toLowerCase();
    // osvětlení
    if (t.includes('light') || c.includes('light')) return 'osvětlení';
    // láhve a košíky
    if (t.includes('bottle') || t.includes('holder') || c.includes('bottles')) return 'láhve a košíky';
    // zámky
    if (t.includes('lock')) return 'zámky';
    // elektronika
    if (t.includes('electronic') || t.includes('charger') || t.includes('cable') || t.includes('smartphone')) return 'elektronika';
    // blatníky
    if (t.includes('mudguard') || c.includes('mudguard')) return 'blatníky';
    // sedlovky
    if (t.includes('seat post') || t.includes('seat') || c.includes('seat')) return 'sedlovky';
    // představce
    if (t.includes('stem')) return 'představce';
    // fallback: try coarse category keywords
    if (c.includes('mudguard')) return 'blatníky';
    if (c.includes('light')) return 'osvětlení';
    if (c.includes('bottle')) return 'láhve a košíky';
    if (c.includes('lock')) return 'zámky';
    if (c.includes('seat')) return 'sedlovky';
    if (c.includes('stem')) return 'představce';
    if (c.includes('elect')) return 'elektronika';
    return '';
  };

  const filtered = all.filter((a) => {
    if (qSearch) {
      const hay = [
        a.nrLf,
        a.ean,
        a.produkt,
        a.marke,
        a.modell,
        a.spezifikation,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(qSearch)) return false;
    }
    if (qBrand && a.marke !== qBrand) return false;
    if (qYear) {
      const y = Number(qYear);
      if (Number.isFinite(y)) {
        if ((a.modelljahr ?? null) !== y) return false;
      }
    }
    if (qType && (a.productType ?? '') !== qType) return false;
    if (qCategorie && (a.categorie ?? '') !== qCategorie) return false;
    if (qGroup) {
      const g = mapToGroup(a);
      if (g !== qGroup) return false;
    }
    return true;
  });

  const total = filtered.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = Math.min(total, start + pageSize);
  const items = filtered.slice(start, end);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    types: allTypes,
  });
}


