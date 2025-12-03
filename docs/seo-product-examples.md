# Product Page SEO Examples

This document shows examples of dynamically generated SEO metadata for different product types.

---

## E-Bike Examples

### Example 1: BULLS Sonic EVO AM 1
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Sonic EVO AM 1",
  year: 2025,
  category: "E-MTB Fully",
  isEbike: true,
  specs: {
    motor: "Bosch Performance Line CX",
    battery: "750 Wh",
    frame: "Karbonový rám"
  },
  minPrice: 189990
}
```

**Generated Output:**
```
Title: BULLS Sonic EVO AM 1 – Bosch CX 750Wh | Biketime.cz
Description: Detailní specifikace elektrokola BULLS Sonic EVO AM 1 2025 – Motor Bosch CX, baterie 750 Wh, karbonový rám. Kategorie: E-MTB Fully. Cena od 189 990 Kč. Zjistit dostupnost.
```

---

### Example 2: BULLS Vuca EVO 10
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Vuca EVO 10",
  year: 2025,
  category: "E-Trekking",
  isEbike: true,
  specs: {
    motor: "Bosch Performance Line",
    capacity: "625 Wh",
    frame: "Hliníkový rám"
  },
  minPrice: 94990
}
```

**Generated Output:**
```
Title: BULLS Vuca EVO 10 – Bosch 625Wh | Biketime.cz
Description: Detailní specifikace elektrokola BULLS Vuca EVO 10 2025 – Motor Bosch, baterie 625 Wh, hliníkový rám. Kategorie: E-Trekking. Cena od 94 990 Kč. Zjistit dostupnost.
```

---

### Example 3: BULLS Copperhead EVO 3
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Copperhead EVO 3",
  year: 2025,
  category: "E-MTB Hardtail",
  isEbike: true,
  specs: {
    motor: "Shimano EP801",
    battery: "630 Wh"
  },
  minPrice: 119990
}
```

**Generated Output:**
```
Title: BULLS Copperhead EVO 3 – Shimano EP801 630Wh | Biketime.cz
Description: Detailní specifikace elektrokola BULLS Copperhead EVO 3 2025 – Motor Shimano EP801, baterie 630 Wh. Kategorie: E-MTB Hardtail. Cena od 119 990 Kč. Zjistit dostupnost.
```

---

## Regular Bike Examples

### Example 4: BULLS Sharptail 1
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Sharptail 1",
  year: 2025,
  category: "MTB Hardtail",
  isEbike: false,
  specs: {
    groupset: "Shimano Deore 12-speed",
    suspension: "RockShox 120mm",
    frame: "Hliníkový rám"
  },
  minPrice: 29990
}
```

**Generated Output:**
```
Title: BULLS Sharptail 1 – Shimano Deore 12-speed | Biketime.cz
Description: Detailní specifikace kola BULLS Sharptail 1 2025 – Shimano Deore 12-speed, RockShox 120mm, hliníkový rám. Kategorie: MTB Hardtail. Cena od 29 990 Kč. Zjistit dostupnost.
```

---

### Example 5: BULLS Raptor Disc
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Raptor Disc",
  year: 2025,
  category: "Racing Bike",
  isEbike: false,
  specs: {
    groupset: "Shimano 105",
    frame: "Karbonový rám"
  },
  minPrice: 44990
}
```

**Generated Output:**
```
Title: BULLS Raptor Disc – Shimano 105 | Biketime.cz
Description: Detailní specifikace kola BULLS Raptor Disc 2025 – Shimano 105, karbonový rám. Kategorie: Racing Bike. Cena od 44 990 Kč. Zjistit dostupnost.
```

---

### Example 6: BULLS Wildtail (No price yet)
**Input Data:**
```typescript
{
  brand: "BULLS",
  model: "Wildtail",
  year: 2025,
  category: "MTB Hardtail",
  isEbike: false,
  specs: {
    groupset: "Shimano Alivio",
    suspension: "SR Suntour XCM"
  }
  // No price available
}
```

**Generated Output:**
```
Title: BULLS Wildtail – Shimano Alivio | Biketime.cz
Description: Detailní specifikace kola BULLS Wildtail 2025 – Shimano Alivio, SR Suntour XCM. Kategorie: MTB Hardtail. Zjistit dostupnost.
```

---

## Key Features

### E-Bikes:
- ✅ Motor name simplified (removes "Performance Line")
- ✅ Battery capacity extracted (e.g., "750 Wh")
- ✅ Frame material mentioned
- ✅ "Elektrokola" used in description

### Regular Bikes:
- ✅ Groupset as primary feature
- ✅ Suspension mentioned
- ✅ Frame material included
- ✅ "Kola" used in description

### Both:
- ✅ Title: ~60 characters (SEO optimal)
- ✅ Description: 150-160 characters (SEO optimal)
- ✅ Price format: Czech locale (spaces as thousands separator)
- ✅ Clear call-to-action: "Zjistit dostupnost"
- ✅ Category mentioned
- ✅ Year included

---

## Implementation Notes

The SEO generator is in `/src/lib/seo.ts` and provides:

1. `generateProductTitle(product)` - Creates title
2. `generateProductDescription(product)` - Creates description
3. `generateProductMetadata(product)` - Complete metadata object

Use this on product detail pages to automatically generate SEO-optimized metadata based on actual product specifications.
