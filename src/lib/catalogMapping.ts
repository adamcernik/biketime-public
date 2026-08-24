/* eslint-disable @typescript-eslint/no-explicit-any */
// Sdílená klasifikace produktů — používá katalogové API i ceník, aby
// e-bike detekce a české názvy kategorií byly všude stejné.

export const isEbikeProduct = (b: any): boolean => {
    // If explicit flag exists
    if (typeof b.isEbike === 'boolean') return b.isEbike;

    const cat = (b.category || '').toLowerCase();
    const spec = b.specs || {};
    const drive = (spec.motor || '').toLowerCase();
    const battery = (spec.battery || spec.capacity || '').toLowerCase();
    const modelName = (b.model || '').toLowerCase();

    return (
        cat.startsWith('e-') ||
        drive.includes('elektro') ||
        drive.includes('bosch') ||
        drive.includes('brose') ||
        drive.includes('shimano') ||
        drive.length > 0 || // If it has a motor specified, it's likely an e-bike
        battery.length > 0 ||
        modelName.startsWith('e-') ||
        modelName.includes('e-stream')
    );
};

export const mapRawToTag = (raw: string, isE: boolean): string | null => {
    const r = raw.trim();
    if (!r) return null;
    if (isE) {
        if (r === 'E-ATB Hardtail' || r === 'E-MTB hardtail') return 'Hardtail';
        if (r === 'E-MTB Fully') return 'Celopéra';
        if (r === 'E-SUV Fully / E-ATB Fully') return 'SUV Celopéra';
        if (r === 'E-city / E-trekking' || r === 'Trekking & City') return 'Trekking';
        if (r === 'E-urban') return 'Město';
        if (r === 'E-Gravelbike / E-Cyclocross') return 'Gravel';
        if (r === 'E-youth bike') return 'Mládež';
        return null;
    } else {
        if (r === 'ATB / SUV' || r === 'Cross' || r === 'Cross Street' || r === 'Trekking & City') return 'SUV/Trekking';
        if (r === 'Gravelbike / Cyclocross') return 'Gravel';
        if (r === "Children's bike") return 'Dětské';
        if (r === 'MTB hardtail') return 'Hardtail';
        if (r === 'MTB Fully') return 'Celopéra';
        if (r === 'Racing bike') return 'Silnice';
        if (r === 'Youth bike' || r === 'BMX') return 'Mládež';
        return null;
    }
};
