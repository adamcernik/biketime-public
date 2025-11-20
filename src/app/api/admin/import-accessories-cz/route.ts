import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, deleteField, doc, getDocs, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

type CsvRow = {
  kat: string; // Kat.č. pův.
  nameCz: string; // Název modelu
  state: string; // Stav
  mocCzkGross: number | null; // MOC s DPH
  mocCzkNet: number | null; // MOC bez DPH
  katA: number | null; // KATEGORIE A
  katB: number | null; // KATEGORIE B
};

function toCzkNumber(value: string): number | null {
  // Remove currency and thousand separators; keep digits only
  const cleaned = String(value).replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string): string[] {
  // Basic CSV splitting supporting quotes and commas
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim().replace(/^"|"$/g, ''));
}

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => splitCsvLine(l));
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function mapRow(header: string[], row: string[]): CsvRow {
  const idx = (name: string): number =>
    header.findIndex((h) => normalizeHeader(h) === normalizeHeader(name));
  const get = (name: string): string => {
    const pos = idx(name);
    return pos >= 0 ? (row[pos] ?? '').trim() : '';
  };
  const state = get('Stav');
  return {
    kat: get('Kat.č. pův.'),
    nameCz: get('Název modelu'),
    state,
    mocCzkGross: toCzkNumber(get('MOC s DPH')),
    mocCzkNet: toCzkNumber(get('MOC bez DPH')),
    katA: toCzkNumber(get('KATEGORIE A')),
    katB: toCzkNumber(get('KATEGORIE B')),
  };
}

export async function GET(_req: NextRequest) {
  // Safety: disabled on production/Vercel
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const csvPath = path.join(process.cwd(), 'MonkeyLinkCZ.csv');
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: 'CSV file not found at project root' }, { status: 404 });
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }
  const header = rows[0]!;
  const dataRows = rows.slice(1);

  const accessoriesRef = collection(db, 'accessories');
  const snap = await getDocs(accessoriesRef);
  const existingIds = new Set<string>();
  snap.forEach((d) => existingIds.add(d.id));

  let updated = 0;
  let notFound = 0;
  const notFoundIds: string[] = [];

  const chunkSize = 400;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const r of chunk) {
      const mapped = mapRow(header, r);
      const id = mapped.kat;
      if (!id) continue;
      if (!existingIds.has(id)) {
        notFound += 1;
        notFoundIds.push(id);
        continue;
      }
      const payload: Record<string, unknown> = {
        // Replace English product name with Czech translation
        produkt: mapped.nameCz || deleteField(),
        produktCs: mapped.nameCz || deleteField(),
        // Prices in CZK
        mocCzk: mapped.mocCzkGross ?? deleteField(),
        mocCzkNet: mapped.mocCzkNet ?? deleteField(),
        priceLevelsCzk: {
          A: mapped.katA ?? null,
          B: mapped.katB ?? null,
        },
        // Simple stock info
        inStock: /skladem/i.test(mapped.state || ''),
        // Initial visibility mirrors stock
        isVisible: /skladem/i.test(mapped.state || ''),
        availability: mapped.state || '',
        updatedAt: Date.now(),
        // Delete EUR price fields if present
        ekPl: deleteField(),
        uvpPl: deleteField(),
        uavpPl: deleteField(),
      };
      batch.set(doc(db, accessoriesRef.path, id), payload, { merge: true });
      updated += 1;
    }
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }

  return NextResponse.json({
    parsed: dataRows.length,
    updated,
    notFound,
    notFoundIds,
    note: 'Matched by NrLf (Kat.č. pův.). Replaced produkt with Czech name, set mocCzk, categories A/B, stock flag, and removed EUR price fields.',
  });
}


