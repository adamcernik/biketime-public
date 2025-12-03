# Open Graph (OG) Images for Social Media Sharing

This guide explains how to set up images for WhatsApp, Facebook, LinkedIn, and other social platforms.

## Image Requirements

### Specifications:
- **Dimensions:** 1200 x 630 pixels (recommended)
- **Format:** JPG or PNG (JPG preferred for WhatsApp)
- **Aspect Ratio:** 1.91:1
- **File Size:** Under 1MB (max 5MB)
- **Location:** `/public/og-image.jpg` (or any path in `/public/`)

### Design Tips:
- Include your logo
- Use high contrast text
- Keep important content in center (edges may be cropped)
- Avoid small text (will be unreadable in thumbnails)
- Test on mobile and desktop

---

## Implementation

### 1. Default Site-Wide Image

**File:** `/src/app/layout.tsx`

Already implemented! The default OG image for the entire site is configured in the root layout:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://biketime.cz'),
  openGraph: {
    images: [
      {
        url: '/og-image.jpg',  // Place this file in /public/
        width: 1200,
        height: 630,
      },
    ],
  },
};
```

**To use:**
1. Create a 1200x630 image with your branding
2. Save it as `/public/og-image.jpg`
3. Done! This will be used for all pages by default

---

### 2. Page-Specific Images (Static Pages)

For **static pages** like About, Contact, etc., you can override the metadata:

**Example:** `/src/app/about/page.tsx`

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'O nás - Biketime',
  description: 'Více o Biketime a našich službách',
  openGraph: {
    title: 'O nás - Biketime',
    description: 'Více o Biketime a našich službách',
    images: [
      {
        url: '/og-about.jpg',  // Custom image for About page
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function AboutPage() {
  return <div>About content...</div>;
}
```

---

### 3. Dynamic Images (Product Pages)

For **dynamic pages** with product images, we need to use Next.js's `generateMetadata` function.

**Create:** `/src/app/catalog/[id]/metadata.ts` (or add to page.tsx)

```tsx
import { Metadata } from 'next';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // Fetch product data
  const productDoc = await getDoc(doc(db, 'products_v2', params.id));
  
  if (!productDoc.exists()) {
    return {
      title: 'Produkt nenalezen',
    };
  }

  const product = productDoc.data();
  const productImage = product.images?.[0] || '/og-image.jpg';

  return {
    title: `${product.brand} ${product.model} – Biketime`,
    description: `${product.brand} ${product.model} ${product.year}. Cena od ${product.minPrice} Kč. ${product.category}.`,
    openGraph: {
      title: `${product.brand} ${product.model}`,
      description: `${product.category} – Rok ${product.year}`,
      images: [
        {
          url: productImage,  // Use the actual bike image!
          width: 1200,
          height: 630,
          alt: `${product.brand} ${product.model}`,
        },
      ],
    },
  };
}
```

**Note:** Since your detail page is currently a client component (`'use client'`), you'd need to:
1. Create a separate server component wrapper, OR
2. Use the API route approach below

---

### 4. Dynamic OG Images via API Route (Advanced)

For fully dynamic OG images (e.g., generating images with product info), create an API route:

**Create:** `/src/app/api/og/route.tsx`

```tsx
import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand') || 'Biketime';
  const model = searchParams.get('model') || 'Bulls';
  const price = searchParams.get('price') || '';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1>{brand} {model}</h1>
        {price && <p style={{ fontSize: 64 }}>od {price} Kč</p>}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

Then use it:
```tsx
openGraph: {
  images: [`/api/og?brand=${brand}&model=${model}&price=${price}`],
}
```

---

## Testing Your OG Images

### Online Tools:
1. **Facebook Debugger:** https://developers.facebook.com/tools/debug/
2. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
3. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
4. **Open Graph Check:** https://opengraphcheck.com/

### WhatsApp Testing:
1. Send the URL to yourself in WhatsApp
2. The preview should appear automatically
3. Note: WhatsApp caches aggressively (may take hours to update)

### Force Cache Refresh:
- Add a query parameter: `?v=2` to your URL
- Or use Facebook Debugger to scrape fresh data

---

## Quick Checklist

✅ Create `/public/og-image.jpg` (1200x630)  
✅ Update `metadataBase` in `layout.tsx` with your domain  
✅ Default OG tags added to root layout  
✅ Test with Facebook Debugger  
✅ Optional: Add page-specific images for key pages  
✅ Optional: Implement dynamic images for products  

---

## Examples of What to Show

### Homepage (`/og-image.jpg`):
- Your logo
- Tagline: "Biketime – kola Bulls v ČR"
- Hero bike image

### Product Pages:
- The actual bike image
- Brand + Model name
- Price
- Year/Category

### Catalog:
- Multiple bikes collage
- "Objevte naši nabídku"
- Bulls logo

---

## Current Status

✅ **Global OG image configured** in `/src/app/layout.tsx`  
📝 **Next steps:**
1. Create `/public/og-image.jpg` file
2. Test with debugger tools
3. Optionally add dynamic product images

