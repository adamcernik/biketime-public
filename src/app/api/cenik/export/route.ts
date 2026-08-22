import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getApprovedCustomer } from '@/lib/shopCustomer';
import { buildCenik, CenikRow } from '@/lib/cenik/buildCenik';
import { registerOfferFonts } from '@/lib/offers/OfferPdf';
import { renderCenikPdf, CenikImageMap } from '@/lib/cenik/CenikPdf';
import { AVAILABILITY_LABELS } from '@/lib/availability';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// PDF s obrázky stahuje stovky miniatur ze ZEG CDN
export const maxDuration = 300;

function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

async function fetchImage(url: string): Promise<{ data: Buffer; format: 'png' | 'jpg' } | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) return null;
        return { data: buf, format: 'png' };
    } catch {
        return null;
    }
}

function buildXlsx(rows: CenikRow[], level: string, companyName: string, date: string) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Biketime';
    const ws = wb.addWorksheet('Ceník');

    const titleRow = ws.addRow(['Dealerský ceník Biketime']);
    titleRow.font = { bold: true, size: 14 };
    if (companyName) ws.addRow([`Pro: ${companyName}`]);
    ws.addRow([`Cenová hladina: ${level}`]);
    ws.addRow([`Vygenerováno: ${date}`]);
    ws.addRow(['VOC bez DPH · MOC s DPH · ceny a dostupnost se mohou měnit']);
    ws.addRow([]);

    const columns = [
        { header: 'NrLf', width: 16 },
        { header: 'EAN', width: 16 },
        { header: 'Kategorie', width: 14 },
        { header: 'Model', width: 30 },
        { header: 'Rok', width: 7 },
        { header: 'Typ', width: 14 },
        { header: 'Barva', width: 22 },
        { header: 'Baterie', width: 10 },
        { header: 'Velikost', width: 10 },
        { header: 'Dostupnost', width: 18 },
        { header: `MOC s DPH`, width: 14 },
        { header: `VOC bez DPH (${level})`, width: 18 },
    ];
    const headerRow = ws.addRow(columns.map((c) => c.header));
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F5' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFD4D4D8' } } };
    });
    columns.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

    for (const row of rows) {
        for (const size of row.sizes) {
            const r = ws.addRow([
                size.variantId,
                size.ean || '',
                row.category,
                `${row.model}`,
                row.year || '',
                row.preorder ? 'předobjednávka' : '',
                row.color,
                row.capacity ? (row.capacity.toLowerCase().includes('wh') ? row.capacity : `${row.capacity} Wh`) : '',
                size.size,
                AVAILABILITY_LABELS[size.availability],
                row.moc ?? '',
                row.voc ?? '',
            ]);
            r.getCell(11).numFmt = '#,##0 "Kč"';
            r.getCell(12).numFmt = '#,##0 "Kč"';
        }
    }
    return wb.xlsx.writeBuffer();
}

export async function POST(request: NextRequest) {
    try {
        const customer = await getApprovedCustomer(request);
        if (!customer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!(await rateLimit(`cenik-export:${customer.uid}`, 20, 3600))) {
            return NextResponse.json({ error: 'Příliš mnoho exportů, zkuste to později.' }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const format = body?.format === 'pdf' ? 'pdf' : 'xlsx';
        const withImages = body?.withImages === true;
        const keys: string[] | null = Array.isArray(body?.keys) ? body.keys.map(String).slice(0, 5000) : null;

        const data = await buildCenik(customer.priceLevel);
        // Export jen vyfiltrovaných řádků (klient posílá klíče); bez keys = vše.
        // Ceny jsou vždy serverové — klíče jen vybírají podmnožinu.
        const rows = keys ? data.rows.filter((r) => keys.includes(r.key)) : data.rows;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Žádné položky k exportu.' }, { status: 400 });
        }

        const date = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
        const baseName = `cenik-biketime-${slugify(customer.companyName || customer.uid)}-${data.level}`;

        if (format === 'xlsx') {
            const buffer = await buildXlsx(rows, data.level, customer.companyName, date);
            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${baseName}.xlsx"`,
                    'Cache-Control': 'no-store',
                },
            });
        }

        // PDF
        registerOfferFonts(request.nextUrl.origin);
        const images: CenikImageMap = {};
        if (withImages) {
            // Miniatury po dávkách, ať nezahluší CDN ani paměť; jedna vadná
            // fotka nesmí shodit celý export.
            const BATCH = 25;
            for (let i = 0; i < rows.length; i += BATCH) {
                await Promise.all(rows.slice(i, i + BATCH).map(async (row) => {
                    if (!row.image) return;
                    images[row.key] =
                        (await fetchImage(getOptimizedImageUrl(row.image, 'small', row.brand))) ??
                        (await fetchImage(row.image)) ??
                        undefined;
                }));
            }
        }
        const buffer = await renderCenikPdf(data, rows, customer.companyName, withImages, images);
        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${baseName}.pdf"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Cenik export error:', error);
        return NextResponse.json({ error: 'Export se nepodařil.' }, { status: 500 });
    }
}
