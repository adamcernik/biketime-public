import { describe, it, expect } from 'vitest';
import { zegKwLabel } from './zegDisplay';

describe('zegKwLabel', () => {
    // 2026-08-12 je středa v ISO týdnu 33
    const now = new Date('2026-08-12T10:00:00Z');

    it('týden v budoucnu letošního roku → měsíc bez roku', () => {
        expect(zegKwLabel(35, now)).toBe('od srpna');
        expect(zegKwLabel(45, now)).toBe('od listopadu');
    });

    it('týden menší než aktuální → příští rok s rokem', () => {
        expect(zegKwLabel(8, now)).toBe('od února 2027');
        expect(zegKwLabel(1, now)).toBe('od ledna 2027');
    });

    it('aktuální týden → letošek', () => {
        expect(zegKwLabel(33, now)).toBe('od srpna');
    });

    it('neplatné hodnoty → null', () => {
        expect(zegKwLabel(0, now)).toBeNull();
        expect(zegKwLabel(54, now)).toBeNull();
        expect(zegKwLabel(NaN, now)).toBeNull();
    });
});
