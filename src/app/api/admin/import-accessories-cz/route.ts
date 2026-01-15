import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
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
  const cleaned = String(value).replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string): string[] {
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
  return {
    kat: get('Kat.č. pův.'),
    nameCz: get('Název modelu'),
    state: get('Stav'),
    mocCzkGross: toCzkNumber(get('MOC s DPH')),
    mocCzkNet: toCzkNumber(get('MOC bez DPH')),
    katA: toCzkNumber(get('KATEGORIE A')),
    katB: toCzkNumber(get('KATEGORIE B')),
  };
}

export async function GET(req: NextRequest) {
  // 1. Authenticate using API Key
  const authHeader = req.headers.get('authorization');
  if (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
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

  const colRef = adminDb.collection('accessories');
  const snap = await colRef.get();
  const existingIds = new Set<string>();
  snap.forEach((d) => existingIds.add(d.id));

  let updated = 0;
  let notFound = 0;
  const notFoundIds: string[] = [];

  const chunkSize = 400;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    const batch = adminDb.batch();
    for (const r of chunk) {
      const mapped = mapRow(header, r);
      const id = mapped.kat;
      if (!id) continue;
      if (!existingIds.has(id)) {
        notFound += 1;
        notFoundIds.push(id);
        continue;
      }

      const updateData: Record<string, unknown> = {
        updatedAt: Date.now(),
        inStock: /skladem/i.test(mapped.state || ''),
        isVisible: /skladem/i.test(mapped.state || ''), // mirror stock initially
        availability: mapped.state || '',
      };

      if (mapped.nameCz) {
        updateData.produkt = mapped.nameCz;
        updateData.produktCs = mapped.nameCz;
      } else {
        updateData.produkt = admin.firestore.FieldValue.delete();
        updateData.produktCs = admin.firestore.FieldValue.delete();
      }

      if (mapped.mocCzkGross !== null) updateData.mocCzk = mapped.mocCzkGross;
      else updateData.mocCzk = admin.firestore.FieldValue.delete();

      if (mapped.mocCzkNet !== null) updateData.mocCzkNet = mapped.mocCzkNet;
      else updateData.mocCzkNet = admin.firestore.FieldValue.delete();

      updateData.priceLevelsCzk = {
        A: mapped.katA ?? null,
        B: mapped.katB ?? null,
      };

      // Clear EUR prices
      updateData.ekPl = admin.firestore.FieldValue.delete();
      updateData.uvpPl = admin.firestore.FieldValue.delete();
      updateData.uavpPl = admin.firestore.FieldValue.delete();

      batch.set(colRef.doc(id), updateData, { merge: true });
      updated += 1;
    }
    await batch.commit();
  }

  return NextResponse.json({
    parsed: dataRows.length,
    updated,
    notFound,
    notFoundIds,
  });
}
