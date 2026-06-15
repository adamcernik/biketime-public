import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getOffer } from '@/lib/offers/getOffer';
import { eurToCzk, sizePriceEur } from '@/lib/offers/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Make a filesystem-safe ASCII slug for the download filename. */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const offer = await getOffer(token);

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Biketime';
  const ws = wb.addWorksheet('Nabídka');

  // Meta header rows
  const titleRow = ws.addRow([offer.title ?? 'Cenová nabídka']);
  titleRow.font = { bold: true, size: 14 };
  if (offer.client.company) ws.addRow([`Pro: ${offer.client.company}`]);
  if (offer.client.contactName) ws.addRow([`Kontakt: ${offer.client.contactName}`]);
  if (offer.client.email) ws.addRow([`E-mail: ${offer.client.email}`]);
  if (offer.validUntil) ws.addRow([`Platnost do: ${offer.validUntil}`]);
  ws.addRow([`Ceny bez DPH · kurz 1 EUR = ${offer.eurToCzk} CZK`]);
  ws.addRow([]);

  const columns = [
    { header: 'NRLF', key: 'nrLf', width: 16 },
    { header: 'Značka', key: 'brand', width: 10 },
    { header: 'Model', key: 'model', width: 28 },
    { header: 'Rok', key: 'year', width: 7 },
    { header: 'Barva', key: 'color', width: 20 },
    { header: 'Motor', key: 'motor', width: 30 },
    { header: 'Baterie', key: 'battery', width: 22 },
    { header: 'Velikost', key: 'size', width: 10 },
    { header: 'Ks', key: 'qty', width: 6 },
    { header: 'Cena EUR (bez DPH)', key: 'eur', width: 18 },
    { header: 'Cena CZK (bez DPH)', key: 'czk', width: 18 },
  ];

  const headerRow = ws.addRow(columns.map((c) => c.header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F5' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD4D4D8' } } };
  });

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  for (const item of offer.items) {
    for (const size of item.sizes) {
      const eur = sizePriceEur(item, size);
      const row = ws.addRow([
        size.nrLf ?? item.nrLf,
        item.brand ?? '',
        item.model,
        item.year ?? '',
        item.color ?? '',
        item.motor ?? '',
        item.battery ?? '',
        size.size,
        size.quantity ?? '',
        eur,
        eurToCzk(eur, offer.eurToCzk),
      ]);
      row.getCell(10).numFmt = '#,##0 "€"';
      row.getCell(11).numFmt = '#,##0 "Kč"';
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `nabidka-${slugify(offer.client.company || offer.title || offer.id)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
