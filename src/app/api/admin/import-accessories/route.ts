import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

type AccessoryRow = {
  lfSn: string;
  nrLf: string;
  ean: string;
  produkt: string;
  marke: string;
  modell: string;
  spezifikation: string;
  hersteller: string;
  farbe: string;
  modelljahr: number | null;
  ekPl: number | null;
  uvpPl: number | null;
  uavpPl: number | null;
  image: string;
  imageTransparent: string;
  imageDetail1: string;
  imageDetail2: string;
  imageDetail3: string;
  productType: string;
  categorie: string;
};

function toNumber(value: string): number | null {
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Minimal CSV parser for semicolon-delimited files with optional quotes
function parseSemicolonCsv(content: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = content.length;
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  while (i < len) {
    const char = content[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ';') {
      current.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\n') {
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  // Flush last field/row
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows.filter((r) => r.length > 0 && r.some((c) => c.trim().length > 0));
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function mapRow(header: string[], row: string[]): AccessoryRow {
  const idx = (name: string): number =>
    header.findIndex((h) => normalizeHeader(h) === normalizeHeader(name));
  const get = (name: string): string => {
    const pos = idx(name);
    return pos >= 0 ? (row[pos] ?? '').trim() : '';
  };
  return {
    lfSn: get('LfSn'),
    nrLf: get('NrLf'),
    ean: get('EAN'),
    produkt: get('Produkt'),
    marke: get('Marke'),
    modell: get('Modell'),
    spezifikation: get('Spezifikation'),
    hersteller: get('Hersteller'),
    farbe: get('Farbe'),
    modelljahr: (() => {
      const raw = get('Modelljahr');
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),
    ekPl: toNumber(get('EK_PL')),
    uvpPl: toNumber(get('UVP_PL')),
    uavpPl: toNumber(get('UAVP_PL')),
    image: get('image'),
    imageTransparent: get('image-transparent'),
    imageDetail1: get('image-detail-1'),
    imageDetail2: get('image-detail-2'),
    imageDetail3: get('image-detail-3'),
    productType: get('Product type (PRAR)') || get('Product type') || '',
    categorie: get('Categorie (PRGR)') || get('Categorie') || '',
  };
}

export async function GET(_req: NextRequest) {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const csvPath = path.join(process.cwd(), 'ZEG_0_20251112101545.csv');
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: 'CSV file not found at project root' }, { status: 404 });
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseSemicolonCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }
  const header = rows[0]!;
  const dataRows = rows.slice(1);

  const accessoriesRef = collection(db, 'accessories');
  const chunkSize = 400;
  let upserted = 0;

  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const r of chunk) {
      const mapped = mapRow(header, r);
      // Require at least an identifier
      const docId = mapped.nrLf || mapped.ean || mapped.lfSn;
      if (!docId) {
        continue;
      }
      const payload = {
        ...mapped,
        category: 'Accessories',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      batch.set(doc(db, accessoriesRef.path, docId), payload, { merge: true });
      upserted += 1;
    }
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }

  return NextResponse.json({
    parsed: dataRows.length,
    upserted,
    collection: 'accessories',
    note: 'Imported under category Accessories (separate from bikes)',
  });
}


