
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
