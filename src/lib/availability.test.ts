import { describe, it, expect } from 'vitest';
import { variantAvailability, isVariantOrderable, isVariantOnOrder } from './availability';

describe('availability — ruční „vyprodáno" (variant.soldOut)', () => {
    const product = { zeg: { variants: { '1': { s: 0, kw: 8 }, '2': { s: 2, kw: 0 } } } };

    it('přebíjí ZEG termín i status na objednávku', () => {
        const v = { id: '1', soldOut: true, b2bOrderStatus: 'na_objednavku' };
        expect(variantAvailability(product, v)).toBe('sold-out');
        expect(isVariantOrderable(product, v)).toBe(false);
        expect(isVariantOnOrder(v)).toBe(false);
    });

    it('přebíjí i ZEG „skladem"', () => {
        expect(variantAvailability(product, { id: '2', soldOut: true })).toBe('sold-out');
    });

    it('náš sklad má přednost — kus v Lovosicích jde prodat', () => {
        const v = { id: '1', soldOut: true, stock: 2 };
        expect(variantAvailability(product, v)).toBe('ours');
        expect(isVariantOrderable(product, v)).toBe(true);
    });

    it('bez příznaku beze změny', () => {
        expect(variantAvailability(product, { id: '1' })).toBe('zeg-date');
        expect(isVariantOnOrder({ b2bOrderStatus: 'na_objednavku' })).toBe(true);
    });
});
