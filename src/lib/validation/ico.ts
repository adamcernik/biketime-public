/**
 * Czech IČO (identifikační číslo osoby) validation.
 *
 * An IČO is 8 digits where the 8th digit is a checksum over the first 7 (mod-11
 * weighted scheme). Validating client- AND server-side lets us reject typos
 * before spending an ARES round-trip, and refuse obviously bogus input at the
 * API boundary (never trust the client).
 */

/** Strip spaces and pad short numeric input to 8 digits (ARES/účetní data often drop leading zeros). */
export function normalizeIco(input: string): string {
    const digits = (input || '').replace(/\s+/g, '');
    if (!/^\d+$/.test(digits)) return digits; // leave non-numeric untouched → isValidIco rejects it
    return digits.padStart(8, '0');
}

/** True when `ico` is 8 digits with a valid mod-11 checksum. */
export function isValidIco(ico: string): boolean {
    if (!/^\d{8}$/.test(ico)) return false;

    const weights = [8, 7, 6, 5, 4, 3, 2];
    const digits = ico.split('').map(Number);

    const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
    const mod = sum % 11;
    const checkDigit = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;

    return checkDigit === digits[7];
}
