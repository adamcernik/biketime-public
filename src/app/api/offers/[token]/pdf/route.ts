import { NextRequest, NextResponse } from 'next/server';
import { getOffer } from '@/lib/offers/getOffer';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { registerOfferFonts, renderOfferPdf, type OfferImageMap } from '@/lib/offers/OfferPdf';

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

/** Fetch a single image into a buffer; returns null on any failure. */
async function fetchImage(
  url: string,
  format: 'png' | 'jpg',
): Promise<{ data: Buffer; format: 'png' | 'jpg' } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    return { data: buf, format };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const offer = await getOffer(token);

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  }

  // Fonts and the optimized image CDN are both reached over HTTP; derive the
  // base URL from the request so this works in dev and in every region.
  registerOfferFonts(req.nextUrl.origin);

  // Pre-fetch images in parallel so a single broken image can't fail the PDF.
  const images: OfferImageMap = {};
  await Promise.all(
    offer.items.map(async (item) => {
      if (!item.imageUrl) return;
      const optimized = getOptimizedImageUrl(item.imageUrl, 'small', item.brand);
      images[item.id] =
        (await fetchImage(optimized, 'png')) ??
        (await fetchImage(item.imageUrl, 'jpg')) ??
        undefined;
    }),
  );

  const buffer = await renderOfferPdf(offer, images);
  const filename = `nabidka-${slugify(offer.client.company || offer.title || offer.id)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
