import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

type CsvRow = { nrLf: string; price: number };

function parseCsv(content: string): CsvRow[] {
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];

    // Normalize header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Find columns
    const idxNr = header.findIndex((h) => ['nrlf', 'nr lf', 'nr_lf', 'lfnr', 'lf sn', 'lfsn'].includes(h));

    // Look for price columns like 'b2b', 'voc', 'price', 'cena'
    const idxPrice = header.findIndex((h) => ['b2b', 'voc', 'price', 'cena', 'voc czk', 'b2b price'].includes(h));

    if (idxNr === -1 || idxPrice === -1) {
        console.error('CSV Header missing required columns:', header);
        return [];
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        // Handle potential quoted fields if simple split doesn't suffice (simplified here)
        const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));

        const nr = (cols[idxNr] ?? '').trim();
        const priceRaw = (cols[idxPrice] ?? '').trim();

        if (!nr) continue;

        // Clean price string (remove currency, comma as decimal separator if needed)
        // Check if comma is used as decimal or thousand separator. 
        // Simple heuristic: remove spaces, replace comma with dot if it looks like decimal
        let cleanPrice = priceRaw.replace(/[^0-9.,]/g, '');

        // If comma exists, normalize to dot
        cleanPrice = cleanPrice.replace(',', '.');

        const priceNum = Number(cleanPrice);

        if (!Number.isFinite(priceNum) || priceNum <= 0) continue;

        rows.push({ nrLf: nr, price: Math.round(priceNum) });
    }
    return rows;
}

export async function GET() {
    // Safety check - allow in dev or if explicitly enabled
    // Note: User requested this feature, so we enable it. In prod, maybe protect it?
    // Using same simple check as import-moc for now.
    // if (process.env.NODE_ENV === 'production') { ... } 

    const csvPath = path.join(process.cwd(), 'B2B-Prices.csv');
    if (!fs.existsSync(csvPath)) {
        return NextResponse.json({
            error: 'CSV file not found',
            message: 'Please upload B2B-Prices.csv to the project root. Format: NrLf, Price'
        }, { status: 404 });
    }

    const csv = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(csv);

    if (rows.length === 0) {
        return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 });
    }

    const productsRef = collection(db, 'products_v2');
    let updated = 0;
    const notFound: string[] = [];

    // 1. Pre-fetch all products to build a map of NrLf -> ProductID
    // efficient for large datasets instead of querying for each row
    const allProductsSnap = await getDocs(productsRef);
    const nrLfToId = new Map<string, string>();
    const eanToId = new Map<string, string>();

    // Also need to support finding by Variant NrLf
    const variantNrLfToId = new Map<string, string>();

    allProductsSnap.forEach(doc => {
        const data = doc.data();
        const id = doc.id;

        if (data.nrLf) nrLfToId.set(data.nrLf, id);
        if (data.ean) eanToId.set(data.ean, id);
        if (data.id) nrLfToId.set(data.id, id); // Fallback

        if (Array.isArray(data.variants)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.variants.forEach((v: any) => {
                if (v.nrLf) variantNrLfToId.set(v.nrLf, id);
                if (v.ean) eanToId.set(v.ean, id);
                if (v.id) variantNrLfToId.set(v.id, id);
            });
        }
    });

    // 2. Process rows
    const chunkSize = 400;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        let operationsInBatch = 0;

        for (const r of chunk) {
            // Try identify product
            const productId = nrLfToId.get(r.nrLf) || variantNrLfToId.get(r.nrLf) || eanToId.get(r.nrLf);

            // Special case fallback: Try direct query if not in map (unlikely if we fetched everything, but safe)
            if (!productId) {
                // Check if the input is maybe short form or similar? 
                // For now, assume map is complete.
                notFound.push(r.nrLf);
                continue;
            }

            const productRef = doc(db, 'products_v2', productId);

            // Set all price levels to the manual price
            const updateData = {
                priceLevelsCzk: {
                    A: r.price,
                    B: r.price,
                    C: r.price,
                    D: r.price
                },
                manualB2BPrice: r.price, // Flag/Audit
                lastPriceUpdate: new Date().toISOString()
            };

            batch.update(productRef, updateData);
            updated++;
            operationsInBatch++;
        }

        if (operationsInBatch > 0) {
            await batch.commit();
        }
    }

    return NextResponse.json({
        totalRows: rows.length,
        updated,
        notFoundCount: notFound.length,
        notFound: notFound.slice(0, 100) // Show first 100 missing
    });
}
