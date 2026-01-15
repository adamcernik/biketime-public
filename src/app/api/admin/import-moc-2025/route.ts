import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

type CsvRow = { nrLf: string; mocCzk: number };

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const idxNr = header.findIndex((h) => ['nrlf', 'nr lf', 'nr_lf', 'lfnr', 'lf sn', 'lfsn'].includes(h));
  const idxMoc = header.findIndex((h) => ['czk moc', 'moc czk', 'moc_czk', 'moc'].includes(h));
  if (idxNr === -1 || idxMoc === -1) return [];
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(',').map((c) => c.trim());
    const nr = (cols[idxNr] ?? '').trim();
    const mocRaw = (cols[idxMoc] ?? '').trim();
    if (!nr) continue;
    const mocNum = Number(String(mocRaw).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(mocNum)) continue;
    rows.push({ nrLf: nr, mocCzk: Math.round(mocNum) });
  }
  return rows;
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

  const dry = req.nextUrl.searchParams.get('dry') === 'true';
  const csvPath = path.join(process.cwd(), 'Bulls-2025-price.csv');
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: 'CSV file not found at project root' }, { status: 404 });
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV parsed but contains no valid rows' }, { status: 400 });
  }

  const bikesCol = adminDb.collection('bikes');
  let updated = 0;
  let skippedYear = 0;
  const notFound: string[] = [];

  const chunkSize = 40; // Smaller chunk for heavy lookup
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const batch = adminDb.batch();

    for (const r of chunk) {
      const docById = await bikesCol.doc(r.nrLf).get();
      let targetRef: admin.firestore.DocumentReference | null = null;
      let targetData: any = null;

      if (docById.exists) {
        targetRef = docById.ref;
        targetData = docById.data();
      } else {
        const byNr = await bikesCol.where('nrLf', '==', r.nrLf).limit(1).get();
        if (!byNr.empty) {
          targetRef = byNr.docs[0]!.ref;
          targetData = byNr.docs[0]!.data();
        } else {
          const byLfSn = await bikesCol.where('lfSn', '==', r.nrLf).limit(1).get();
          if (!byLfSn.empty) {
            targetRef = byLfSn.docs[0]!.ref;
            targetData = byLfSn.docs[0]!.data();
          }
        }
      }

      if (!targetRef || !targetData) {
        notFound.push(r.nrLf);
        continue;
      }

      const year = Number(targetData.modelljahr ?? targetData['Model Year']);
      if (year && year !== 2025) {
        skippedYear += 1;
        continue;
      }

      if (!dry) {
        batch.update(targetRef, { mocCzk: r.mocCzk });
      }
      updated += 1;
    }

    if (!dry && updated > 0) {
      await batch.commit();
    }
  }

  return NextResponse.json({
    parsed: rows.length,
    updated,
    skippedYear,
    notFoundCount: notFound.length,
    notFound,
    dry,
  });
}

import * as admin from 'firebase-admin';
