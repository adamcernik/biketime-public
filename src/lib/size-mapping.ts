
// Re-trigger build
export type BikeCategory = 'mtb' | 'gravel' | 'road' | 'trekking' | 'city' | 'junior' | 'default';

export interface SizeMapping {
    cm: number;
    label: string; // S, M, L...
    range?: string; // e.g. "160-170 cm" (rider height)
}

// Standard Bulls Size Mappings
// These are approximations based on standard Bulls charts.
// We map a specific frame size (cm) to a Letter.

export const getSizeLabel = (cm: number, category: BikeCategory = 'default'): string => {
    // Round to nearest integer just in case
    const size = Math.round(cm);

    if (category === 'mtb') {
        if (size < 38) return 'XS';
        if (size >= 38 && size < 42) return 'S';
        if (size >= 42 && size < 46) return 'M';
        if (size >= 46 && size < 50) return 'L';
        if (size >= 50 && size < 54) return 'XL';
        if (size >= 54) return 'XXL';
    }

    if (category === 'gravel' || category === 'road') {
        if (size < 48) return 'XS';
        if (size >= 48 && size < 52) return 'S';
        if (size >= 52 && size < 56) return 'M';
        if (size >= 56 && size < 60) return 'L';
        if (size >= 60 && size < 64) return 'XL';
        if (size >= 64) return 'XXL';
    }

    if (category === 'trekking' || category === 'city') {
        if (size < 46) return 'S';
        if (size >= 46 && size < 51) return 'M';
        if (size >= 51 && size < 56) return 'L';
        if (size >= 56 && size < 61) return 'XL';
        if (size >= 61) return 'XXL';
    }

    // Default fallback (similar to MTB/Trekking mix)
    if (size < 40) return 'XS';
    if (size >= 40 && size < 45) return 'S';
    if (size >= 45 && size < 50) return 'M';
    if (size >= 50 && size < 55) return 'L';
    if (size >= 55 && size < 60) return 'XL';
    if (size >= 60) return 'XXL';

    return '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const detectCategory = (bike: any): BikeCategory => {
    const cat = ((bike.categoryPrgr ?? bike['Category (PRGR)'] ?? bike['Categorie (PRGR)'] ?? '').toString()).toLowerCase();
    const model = ((bike.modell ?? '').toString()).toLowerCase();
    const frame = ((bike.frameType ?? bike['Frame type (RTYP)'] ?? '').toString()).toLowerCase();

    if (cat.includes('gravel') || model.includes('grinder') || model.includes('machete') || model.includes('daily grinder')) return 'gravel';
    if (cat.includes('rennrad') || cat.includes('road') || model.includes('alpine') || model.includes('harrier')) return 'road';
    if (cat.includes('mtb') || model.includes('copperhead') || model.includes('bushmaster') || model.includes('sonic') || model.includes('wild') || frame.includes('full') || frame.includes('hardtail')) return 'mtb';
    if (cat.includes('trekking') || cat.includes('city') || model.includes('urban') || model.includes('cross')) return 'trekking';

    return 'default';
};

export const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

export const sortSizes = (a: string, b: string) => {
    const aUpper = a.toUpperCase();
    const bUpper = b.toUpperCase();

    const aIndex = SIZE_ORDER.indexOf(aUpper);
    const bIndex = SIZE_ORDER.indexOf(bUpper);

    // Both are standard sizes
    if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
    }

    // One is standard, one is not
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // Numeric comparison
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);

    if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
    }

    // Fallback to alphanumeric
    return a.localeCompare(b, 'cs', { numeric: true });
};

export const standardizeSize = (size: string, category: BikeCategory = 'default'): string => {
    if (!size) return '';

    // If it's already a standard letter size, return it
    const upper = size.toUpperCase().trim();
    if (SIZE_ORDER.includes(upper)) return upper;

    // Try to parse number
    // Handle "41 cm", "41", "41cm"
    const num = parseInt(size.replace(/[^0-9]/g, ''));

    // Sanity check: frame sizes are usually between 20 and 70 cm
    // Kids bikes might be smaller (12-24 inch wheels, but frame size is different)
    // If it's too small (e.g. 1, 2, 3), it might be a different metric or just an index.
    // But let's assume valid frame sizes for now.

    if (!isNaN(num) && num > 20 && num < 80) {
        const label = getSizeLabel(num, category);
        if (label) return label;
    }

    return size; // Return original if no mapping found
};
