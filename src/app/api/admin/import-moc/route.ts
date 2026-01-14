import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_API_KEY || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Also keep the existing Vercel check if you want, or rely solely on API Key
  if (process.env.VERCEL === '1') {
    // In production/Vercel, we must use the API Key.
    // The old check disabled it entirely, but now we allow it IF authenticated.
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

  let updated = 0;
  let skippedYear = 0;
  const notFound: string[] = [];

  // Process in chunks with batched writes
  const chunkSize = 400;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const batch = adminDb.batch();

    // For each row, query by nrLf/lfSn
    for (const r of chunk) {
      // Direct doc lookup by ID (nrLf as ID)
      const idRef = adminDb.collection('bikes').doc(r.nrLf);
      const idSnap = await idRef.get();

      let targetDocRef: FirebaseFirestore.DocumentReference | null = null;
      let targetData: FirebaseFirestore.DocumentData | null = null;

      if (idSnap.exists) {
        targetDocRef = idRef;
        targetData = idSnap.data()!;
      } else {
        // Query by field nrLf
        const byNr = await adminDb.collection('bikes').where('nrLf', '==', r.nrLf).limit(1).get();
        if (!byNr.empty) {
          const d = byNr.docs[0];
          targetDocRef = d.ref;
          targetData = d.data();
        } else {
          // Query by field lfSn
          const byLfSn = await adminDb.collection('bikes').where('lfSn', '==', r.nrLf).limit(1).get();
          if (!byLfSn.empty) {
            const d = byLfSn.docs[0];
            targetDocRef = d.ref;
            targetData = d.data();
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


