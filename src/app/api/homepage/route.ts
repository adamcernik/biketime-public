/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export async function GET(_req: NextRequest) {
  try {
    // Prefer settings/homepage (public readable per rules); fallback to legacy site/homepage
    let cfgSnap = await getDoc(doc(db, 'settings', 'homepage'));
    if (!cfgSnap.exists()) {
      cfgSnap = await getDoc(doc(db, 'site', 'homepage'));
    }
    const featuredIds: string[] = (cfgSnap.exists() ? (cfgSnap.data()?.featuredIds ?? []) : []) as string[];

    // Helpers to extract MOC (CZK) and specs
    const toNumberFromMixed = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
      if (!s) return null;
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };
    const PRICE_KEYS = ['moc','MOC','mocCzk','mocCZK','priceCzk','priceCZK','uvpCZK','uvp','UVP'];
    const getMocCzk = (b: any): number | null => {
      for (const k of PRICE_KEYS) {
        const n = toNumberFromMixed(b[k]);
        if (n != null) return n;
      }
      const spec = (b?.specifications ?? {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(spec)) {
        if (/moc|uvp|price|cena/i.test(k)) {
          const n = toNumberFromMixed(v);
          if (n != null) return n;
        }
      }
      return null;
    };
    const getMotor = (b: any): string => {
      return (
        b.motor ||
        b.specifications?.['Motor (MOTM)'] ||
        b.specifications?.['MOTM'] ||
        ''
      );
    };
    const getBattery = (b: any): string => {
      return (
        b.akku ||
        b.specifications?.['Battery (Wh) (AKLW)'] ||
        b.specifications?.['AKLW'] ||
        b.specifications?.['AKKU'] ||
        ''
      );
    };

    const bikes: any[] = [];
    for (const id of featuredIds.slice(0, 3)) {
      const s = await getDoc(doc(db, 'bikes', id));
      if (s.exists()) {
        const d = s.data() as any;
        // Derive MOC CZK; if not present directly, try to inherit from family (same NRLF base)
        let mocCzk = getMocCzk(d);
        if (mocCzk == null) {
          const nr = ((d.nrLf as string | undefined) ?? (d.lfSn as string | undefined) ?? '').toString();
          const base = nr.match(/^(.*?)(\d{2})$/)?.[1] ?? nr;
          if (base) {
            const listSnap = await getDocs(query(collection(db, 'bikes'), where('isActive', '==', true)));
            const familyDocs = listSnap.docs
              .map(dd => dd.data() as any)
              .filter(b => (((b.nrLf as string | undefined) ?? (b.lfSn as string | undefined) ?? '').toString()).startsWith(base));
            const explicit = familyDocs.map((b) => toNumberFromMixed((b as any)['mocCzk'])).find(v => v != null);
            if (explicit != null) {
              mocCzk = explicit;
            } else {
              const derived = familyDocs.map(getMocCzk).find(v => v != null);
              if (derived != null) mocCzk = derived;
            }
          }
        }
        bikes.push({
          id: s.id,
          marke: d.marke ?? '',
          modell: d.modell ?? '',
          bild1: d.bild1 ?? '',
          mocCzk: mocCzk ?? null,
          motor: getMotor(d) ?? '',
          akku: getBattery(d) ?? '',
        });
      }
    }

    return NextResponse.json({ featured: bikes, ids: featuredIds });
  } catch (e) {
    console.error('Homepage API error', e);
    return NextResponse.json({ featured: [], ids: [] }, { status: 200 });
  }
}


