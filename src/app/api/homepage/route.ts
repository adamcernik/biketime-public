import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(_req: NextRequest) {
  try {
    // Prefer settings/homepage (public readable per rules); fallback to legacy site/homepage
    let cfgSnap = await getDoc(doc(db, 'settings', 'homepage'));
    if (!cfgSnap.exists()) {
      cfgSnap = await getDoc(doc(db, 'site', 'homepage'));
    }
    const featuredIds: string[] = (cfgSnap.exists() ? (cfgSnap.data()?.featuredIds ?? []) : []) as string[];

    const bikes: any[] = [];
    for (const id of featuredIds.slice(0, 3)) {
      const s = await getDoc(doc(db, 'bikes', id));
      if (s.exists()) {
        const d = s.data() as any;
        bikes.push({
          id: s.id,
          marke: d.marke ?? '',
          modell: d.modell ?? '',
          bild1: d.bild1 ?? '',
        });
      }
    }

    return NextResponse.json({ featured: bikes });
  } catch (e) {
    console.error('Homepage API error', e);
    return NextResponse.json({ featured: [] }, { status: 200 });
  }
}


