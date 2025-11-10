import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
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

export async function GET(_req: NextRequest) {
  // Safety: do not allow on production Vercel
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }
  const csvPath = path.join(process.cwd(), 'Bulls-2026-MOC-prices.csv');
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: 'CSV file not found at project root' }, { status: 404 });
  }
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV parsed but contains no valid rows' }, { status: 400 });
  }

  const bikesRef = collection(db, 'bikes');
  let updated = 0;
  let skippedYear = 0;
  const notFound: string[] = [];

  // Process in chunks with batched writes
  const chunkSize = 400;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    // For each row, try by doc id, otherwise query by nrLf/lfSn
    for (const r of chunk) {
      const idRef = doc(db, 'bikes', r.nrLf);
      // eslint-disable-next-line no-await-in-loop
      const idSnap = await getDoc(idRef);
      let targetDocRef: ReturnType<typeof doc> | null = null;
      let targetData: Record<string, unknown> | null = null;
      if (idSnap.exists()) {
        targetDocRef = idRef;
        targetData = idSnap.data() as Record<string, unknown>;
      } else {
        // eslint-disable-next-line no-await-in-loop
        const byNr = await getDocs(query(bikesRef, where('nrLf', '==', r.nrLf)));
        if (!byNr.empty) {
          const d = byNr.docs[0]!;
          targetDocRef = doc(db, 'bikes', d.id);
          targetData = d.data() as Record<string, unknown>;
        } else {
          // eslint-disable-next-line no-await-in-loop
          const byLfSn = await getDocs(query(bikesRef, where('lfSn', '==', r.nrLf)));
          if (!byLfSn.empty) {
            const d = byLfSn.docs[0]!;
            targetDocRef = doc(db, 'bikes', d.id);
            targetData = d.data() as Record<string, unknown>;
          }
        }
      }

      if (!targetDocRef || !targetData) {
        notFound.push(r.nrLf);
        continue;
      }
      const year = Number((targetData.modelljahr as unknown) ?? (targetData['Model Year'] as unknown));
      if (year && year !== 2026) {
        skippedYear += 1;
        continue;
      }
      batch.update(targetDocRef, { mocCzk: r.mocCzk });
      updated += 1;
    }
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }

  return NextResponse.json({
    parsed: rows.length,
    updated,
    skippedYear,
    notFoundCount: notFound.length,
    notFound,
  });
}


