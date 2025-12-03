# ZEG CDN Image Optimization - Analysis & Implementation

## 🎯 Objective
Optimize product images by using ZEG's CDN with multiple resolution options instead of always loading full-size images.

---

## 📊 CDN Structure Discovered

From the screenshot provided, ZEG CDN has the following structure:

```
https://cdn-assets.zeg.de/brands/{brand_id}/{size_folder}/{filename}
```

### Available Image Sizes:
1. **326x217_png** - Thumbnail (smallest)
2. **460x307_png** - Small  
3. **542x361_png** - Medium
4. **1050x700_png** - Large (highest quality)

### Example URL:
```
https://cdn-assets.zeg.de/brands/1319839/542x361_png/ZEG_524901200440.png
```

---

## 🔍 Current Implementation

Your current product images use this pattern:
```
https://assets.zeg.de/{id}/hub_main/{filename}.jpg
Example: https://assets.zeg.de/1678540/hub_main/ZEG_525900250841.jpg
```

---

## 🧩 Key Questions to Answer

### 1. **What is the Brand ID?**
- In the example: `1319839`
- Is this the same for all BULLS products?
- Do different brands (Pegasus, etc.) have different IDs?
- Can we extract it from the current URL structure?

### 2. **Image Format Conversion**
- Current URLs use `.jpg`
- CDN URLs use `.png`
- Do we need to convert the extension, or does ZEG host both formats?

### 3. **Filename Extraction**
- Current: `ZEG_525900250841.jpg`
- CDN: `ZEG_524901200440.png`
- Can we reliably extract and convert the filename?

### 4. **Brand ID Mapping**
Possible approaches:
- **Static mapping**: Bulls = 1319839, Pegasus = ???
- **Extract from existing URL**: Parse the ID from current URLs
- **Database field**: Add brandId to product data

---

## 🧪 Testing Plan

### Phase 1: Test Page Created ✅
- Created `/test-cdn` page
- Allows testing different URL patterns
- Visual verification of which sizes work

### Phase 2: Analyze URL Patterns
1. Get sample product URLs from database
2. Test URL transformation
3. Identify brand ID pattern
4. Document working combinations

### Phase 3: Create Helper Function
```typescript
// Utility to generate optimized image URL
function getOptimizedImageUrl(
  originalUrl: string, 
  size: 'thumbnail' | 'small' | 'medium' | 'large'
): string {
  // Extract filename and brand ID
  // Generate CDN URL with appropriate size
  // Return optimized URL with fallback
}
```

---

## 💡 Proposed Solution

### Option A: Direct CDN URLs (Recommended if patterns match)
```typescript
const IMAGE_SIZES = {
  thumbnail: '326x217_png',
  small: '460x307_png',
  medium: '542x361_png',
  large: '1050x700_png'
};

const BRAND_IDS = {
  'BULLS': '1319839',
  'PEGASUS': 'TBD',
  // ... other brands
};

function getImageUrl(bike: Bike, size: keyof typeof IMAGE_SIZES = 'medium'): string {
  if (!bike.bild1) return '/placeholder.jpg';
  
  // Extract filename from current URL
  const filename = extractFilename(bike.bild1);
  const brandId = BRAND_IDS[bike.marke] || BRAND_IDS['BULLS'];
  
  // Generate CDN URL
  const cdnUrl = `https://cdn-assets.zeg.de/brands/${brandId}/${IMAGE_SIZES[size]}/${filename}`;
  
  // Fallback to original
  return cdnUrl || bike.bild1;
}
```

### Option B: Next.js Image Optimization (Fallback)
If CDN URLs don't work consistently:
```tsx
<Image 
  src={bike.bild1}
  width={400}
  height={300}
  quality={75}
  alt={bike.modell}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

---

## 📝 Implementation Checklist

- [x] Create test page (`/test-cdn`)
- [ ] Fetch real product URLs from database
- [ ] Test URL transformation patterns
- [ ] Identify brand ID mapping
- [ ] Document working URL patterns
- [ ] Create helper utility function
- [ ] Implement in BikeCard component
- [ ] Test on product detail pages
- [ ] Measure performance improvements

---

## 🚀 Usage Example (After Implementation)

```tsx
import { getOptimizedImageUrl } from '@/lib/imageUtils';

// In BikeCard component
<img 
  src={getOptimizedImageUrl(bike.bild1, 'thumbnail', bike.marke)}
  alt={bike.modell}
  loading="lazy"
/>

// In Product Detail page
<img 
  src={getOptimizedImageUrl(bike.bild1, 'large', bike.marke)}
  alt={bike.modell}
/>
```

---

## 📊 Expected Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Card Thumbnails | ~500KB | ~50KB (10x smaller) |
| Page Load Time | Slower | Faster |
| Mobile Performance | Poor | Excellent |
| Bandwidth Usage | High | Low |

---

## 🧪 Next Steps

1. **Test the page**: Go to http://localhost:3002/test-cdn
2. **Get sample URLs**: Visit http://localhost:3002/api/test-images
3. **Test transformations**: 
   - Paste real product URLs
   - Try different brand IDs
   - Check which patterns work
4. **Document findings**: Update this file with results

---

## 🔗 Test URLs

Access the test page at:
- Local: `http://localhost:3002/test-cdn`
- Sample data: `http://localhost:3002/api/test-images`

---

**Status**: 🧪 Ready for Testing
**Created**: 2025-12-03
