import { describe, it, expect } from 'vitest';
import { isValidIco, normalizeIco } from './ico';

describe('isValidIco', () => {
    // Real companies (verified against ARES)
    it.each([
        ['27604977', 'Google Czech Republic'],
        ['45274649', 'ČEZ'],
        ['25063677', 'real company'],
        ['26168685', 'real company'],
    ])('accepts valid IČO %s (%s)', (ico) => {
        expect(isValidIco(ico)).toBe(true);
    });

    it.each([
        ['00000000', 'all zeros — checksum fails'],
        ['12345678', 'sequential — checksum fails'],
        // NOTE: the spec's test-data table listed 99999999 as "Not found",
        // but it never reaches ARES — the checksum rejects it first.
        ['99999999', 'all nines — checksum fails'],
        ['27604978', 'valid IČO with last digit off by one'],
        ['1234567', 'too short (7 digits)'],
        ['123456789', 'too long (9 digits)'],
        ['abcdefgh', 'letters'],
        ['2760497a', 'digit replaced by letter'],
        ['', 'empty string'],
    ])('rejects %s (%s)', (ico) => {
        expect(isValidIco(ico)).toBe(false);
    });
});

describe('normalizeIco', () => {
    it('strips whitespace', () => {
        expect(normalizeIco(' 27604977 ')).toBe('27604977');
        expect(normalizeIco('276 049 77')).toBe('27604977');
    });

    it('pads short numeric input with leading zeros (accounting exports drop them)', () => {
        expect(normalizeIco('604977')).toBe('00604977');
    });

    it('leaves 8-digit input unchanged', () => {
        expect(normalizeIco('27604977')).toBe('27604977');
    });

    it('leaves non-numeric input untouched so isValidIco rejects it', () => {
        expect(normalizeIco('abc')).toBe('abc');
        expect(isValidIco(normalizeIco('abc'))).toBe(false);
    });
});
