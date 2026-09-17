import { describe, expect, it } from 'vitest';
import { applyFeedFilters, isProductFeedVisible, mapProductToFeedItems } from './mapProduct';
import { feedToCsv, feedToHeureka, feedToJson, feedToXml } from './serialize';

// Vzorový produkt záměrně obsahuje VŠECHNA citlivá pole (nákupka, ceník
// hladin) — testy hlídají, že se žádné z nich nedostane do výstupu feedu.

const product = {
    brand: 'BULLS',
    model: 'Copperhead EVO 1',
    year: 2026,
    category: 'MTB',
    specs: { motor: 'Bosch CX', battery: '750 Wh' },
    images: ['https://assets.zeg.de/p/root.jpg'],
    // Citlivá pole — NIKDY nesmí ven:
    ekPl: 999.99,
    uvpPl: 1999.99,
    vocCzk: 33333,
    priceLevelsCzk: { A: 40000, B: 39000, C: 38000, D: 37000 },
    manualB2BPrice: 0,
    variants: [
        {
            id: 'ABC-123', size: '44 cm', color: 'černá', capacity: '750',
            price: 62915, ean: '4030774331234',
            images: ['https://assets.zeg.de/p/variant.jpg'],
            ekPl: 888.88, // citlivé i na variantě
            stock: 2,
        },
        {
            id: 'ABC-124', size: '48 cm', color: 'černá', capacity: '750',
            price: 62915, b2bOrderStatus: 'na_objednavku',
        },
    ],
};

// Partnerova vlastní VOC (hladina A = 40000) ve feedu být MÁ; citlivé jsou
// nákupní ceny a hodnoty OSTATNÍCH hladin.
const SENSITIVE = ['ekPl', 'uvpPl', 'priceLevelsCzk', '999.99', '1999.99', '888.88', '33333', '39000', '38000', '37000'];

describe('mapProductToFeedItems', () => {
    const items = mapProductToFeedItems('prod-1', product, 'A');

    it('vyrobí položku per varianta s cenami a dostupností', () => {
        expect(items).toHaveLength(2);
        expect(items[0].itemId).toBe('ABC-123');
        expect(items[0].mocCzkVat).toBe(62915);
        expect(items[0].vocCzk).toBeGreaterThan(0);
        expect(items[0].availability).toBe('ours');
        expect(items[1].availability).toBe('on-order');
        expect(items[0].images).toEqual(['https://assets.zeg.de/p/variant.jpg']);
        expect(items[1].images).toEqual(['https://assets.zeg.de/p/root.jpg']);
    });

    it('VOC odpovídá hladině (A = MOC × ~0.6357 škálovaná přes anchor)', () => {
        // priceLevelsCzk.A = 40000, anchor MOC = 62915 → VOC pro MOC 62915 = 40000
        expect(items[0].vocCzk).toBe(40000);
    });

    it.each(['xml', 'csv', 'json'] as const)('výstup %s neobsahuje nákupní ceny ani ceník hladin', (format) => {
        const meta = { level: 'A' as const, generatedAt: '2026-09-17T00:00:00.000Z' };
        const out = format === 'xml' ? feedToXml(items, meta)
            : format === 'csv' ? feedToCsv(items)
                : feedToJson(items, meta);
        for (const needle of SENSITIVE) {
            expect(out, `"${needle}" uniklo do ${format} feedu`).not.toContain(needle);
        }
    });

    it('samotné položky neobsahují citlivé klíče (allowlist)', () => {
        const raw = JSON.stringify(items);
        expect(raw).not.toContain('ekPl');
        expect(raw).not.toContain('uvpPl');
        expect(raw).not.toContain('priceLevelsCzk');
        expect(raw).not.toContain('b2bPrice');
    });
});

describe('applyFeedFilters', () => {
    const items = mapProductToFeedItems('prod-1', product, 'A');

    it('onlyAvailable nechá jen objednatelné', () => {
        const noStock = mapProductToFeedItems('prod-2', {
            ...product,
            variants: [{ id: 'X-1', size: '44 cm', price: 1000 }],
        }, 'A');
        expect(applyFeedFilters(noStock, { ebike: 'all', onlyAvailable: true })).toHaveLength(0);
        expect(applyFeedFilters(items, { ebike: 'all', onlyAvailable: true })).toHaveLength(2);
    });

    it('ebike filtr rozděluje podle isEbike', () => {
        const all = applyFeedFilters(items, { ebike: 'all', onlyAvailable: false });
        const e = applyFeedFilters(items, { ebike: 'ebike', onlyAvailable: false });
        const b = applyFeedFilters(items, { ebike: 'bike', onlyAvailable: false });
        expect(e.length + b.length).toBe(all.length);
    });
});

describe('feedToHeureka', () => {
    const items = mapProductToFeedItems('prod-1', product, 'A');
    const xml = feedToHeureka(items);

    it('obsahuje jen MOC — žádnou VOC ani citlivé ceny', () => {
        for (const needle of [...SENSITIVE, '40000', 'voc', 'VOC']) {
            expect(xml, `"${needle}" uniklo do Heureka feedu`).not.toContain(needle);
        }
        expect(xml).toContain('<PRICE_VAT>62915</PRICE_VAT>');
    });

    it('má strukturu SHOP/SHOPITEM s ITEMGROUP_ID a DELIVERY_DATE', () => {
        expect(xml).toContain('<SHOP xmlns="http://www.heureka.cz/ns/offer/1.0">');
        expect(xml).toContain('<ITEMGROUP_ID>prod-1</ITEMGROUP_ID>');
        expect(xml).toContain('<DELIVERY_DATE>0</DELIVERY_DATE>');   // skladem
        expect(xml).toContain('<DELIVERY_DATE>30</DELIVERY_DATE>');  // na objednávku
        expect(xml).toContain('<CATEGORYTEXT>Heureka.cz | Sport | Cyklistika | Elektrokola</CATEGORYTEXT>');
    });

    it('vynechá neprodejné položky a položky bez MOC', () => {
        const none = mapProductToFeedItems('prod-x', {
            ...product,
            variants: [{ id: 'N-1', size: '44 cm', price: 1000 }],
        }, 'A');
        expect(none[0].availability).toBe('none');
        expect(feedToHeureka(none)).not.toContain('N-1');
    });
});

describe('isProductFeedVisible', () => {
    it('ročníky 2022–2024 jen skladem / na objednávku, ostatní vždy', () => {
        expect(isProductFeedVisible({ year: 2023, variants: [{ id: 'a', price: 1 }] })).toBe(false);
        expect(isProductFeedVisible({ year: 2023, variants: [{ id: 'a', stock: 1 }] })).toBe(true);
        expect(isProductFeedVisible({ year: 2023, variants: [{ id: 'a', b2bOrderStatus: 'na_objednavku' }] })).toBe(true);
        expect(isProductFeedVisible({ year: 2026, variants: [{ id: 'a', price: 1 }] })).toBe(true);
    });
});

describe('serialize', () => {
    it('XML escapuje speciální znaky', () => {
        const items = mapProductToFeedItems('prod-3', {
            ...product,
            model: 'Sharptail <27,5"> & spol.',
        }, 'A');
        const xml = feedToXml(items, { level: 'A', generatedAt: '2026-09-17T00:00:00.000Z' });
        expect(xml).toContain('&lt;27,5&quot;&gt; &amp; spol.');
        expect(xml).not.toContain('<27,5');
    });

    it('CSV escapuje středníky a uvozovky', () => {
        const items = mapProductToFeedItems('prod-4', {
            ...product,
            model: 'Model; "test"',
        }, 'A');
        const csv = feedToCsv(items);
        expect(csv).toContain('"Model; ""test"""');
    });
});
