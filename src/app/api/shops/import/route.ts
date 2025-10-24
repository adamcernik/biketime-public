import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import path from 'path';

type Shop = { name: string; address: string; website: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseCsv(content: string): Shop[] {
  const lines = content.trim().split(/\r?\n/);
  const [, ...rows] = lines; // skip header
  const shops: Shop[] = [];
  for (const row of rows) {
    const parts = row.split(',');
    if (parts.length < 3) continue;
    const name = parts[0].trim();
    const address = parts[1].trim();
    const website = parts.slice(2).join(',').trim(); // in case commas appear in URL
    if (!name) continue;
    shops.push({ name, address, website });
  }
  return shops;
}

export async function POST() {
  try {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'shops.csv');
    const file = await readFile(csvPath, 'utf8');
    const shops = parseCsv(file);

    const col = collection(db, 'shops');
    await Promise.all(
      shops.map((s) =>
        setDoc(doc(col, slugify(s.name)), {
          name: s.name,
          address: s.address,
          website: s.website,
          updatedAt: serverTimestamp(),
        })
      )
    );

    return NextResponse.json({ ok: true, count: shops.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Import failed' }, { status: 500 });
  }
}

// Allow simple GET import trigger from browser
export async function GET() {
  return POST();
}


