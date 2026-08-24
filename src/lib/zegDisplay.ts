// Převod kalendářního týdne (KW) ze ZEG feedu na srozumitelný český termín.
// Feed nenese rok — odvozujeme ho: KW menší než aktuální ISO týden znamená
// příští rok (letošní výskyt už proběhl).

const MONTHS_GENITIVE = [
    'ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

function isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function mondayOfIsoWeek(week: number, year: number): Date {
    // 4. leden leží vždy v 1. ISO týdnu
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const day = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
    return monday;
}

/**
 * „od srpna" / „od února 2027" — měsíc, kdy má být artikl u výrobce dostupný.
 * Rok se uvádí jen pokud nejde o letošek. Vrací null pro neplatné KW.
 */
export function zegKwLabel(kw: number, now: Date = new Date()): string | null {
    if (!Number.isInteger(kw) || kw < 1 || kw > 53) return null;
    const currentWeek = isoWeek(now);
    const year = kw < currentWeek ? now.getFullYear() + 1 : now.getFullYear();
    const monday = mondayOfIsoWeek(kw, year);
    const month = MONTHS_GENITIVE[monday.getUTCMonth()];
    return year === now.getFullYear() ? `od ${month}` : `od ${month} ${year}`;
}
