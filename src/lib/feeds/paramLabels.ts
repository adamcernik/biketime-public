// České popisky technických parametrů feedu. Klíče odpovídají camelCase
// názvům ve specs produktů (products_v2) — mapování ze ZEG kódů viz
// admin: scripts/import-2027.mjs. Hodnoty parametrů zůstávají tak, jak je
// dodává výrobce (zpravidla anglicky) — překládáme jen názvy.

export const PARAM_LABELS_CZ: Record<string, string> = {
    motorManufacturer: 'Výrobce motoru',
    motor: 'Motor',
    motorType: 'Typ motoru',
    motorPower: 'Výkon motoru',
    motorTorque: 'Točivý moment',
    motorSupport: 'Podpora motoru',
    batteryManufacturer: 'Výrobce baterie',
    battery: 'Baterie',
    capacity: 'Kapacita baterie',
    batteryType: 'Typ baterie',
    charger: 'Nabíječka',
    display: 'Displej',
    frame: 'Rám',
    frameMaterial: 'Materiál rámu',
    fork: 'Vidlice',
    travelFork: 'Zdvih vidlice',
    rearSuspension: 'Zadní tlumič',
    travelRear: 'Zdvih zadního tlumiče',
    headset: 'Hlavové složení',
    wheelSize: 'Velikost kol',
    tireSize: 'Rozměr pláště (ETRTO)',
    tireSizeInch: 'Rozměr pláště (palce)',
    tires: 'Pláště',
    rims: 'Ráfky',
    wheelset: 'Zapletená kola',
    hubFront: 'Přední náboj',
    hubRear: 'Zadní náboj',
    gears: 'Počet převodů',
    derailleurType: 'Typ řazení',
    rearDerailleur: 'Přehazovačka',
    frontDerailleur: 'Přesmykač',
    shifter: 'Řadicí páčky',
    crankset: 'Kliky',
    cassette: 'Kazeta',
    chain: 'Řetěz',
    pedals: 'Pedály',
    brakes: 'Brzdy',
    brakeLever: 'Brzdové páky',
    brakeFront: 'Přední brzda',
    brakeRear: 'Zadní brzda',
    brakeDiscFront: 'Přední brzdový kotouč',
    brakeDiscRear: 'Zadní brzdový kotouč',
    coasterBrake: 'Protišlapná brzda',
    handlebar: 'Řídítka',
    stem: 'Představec',
    grips: 'Gripy',
    saddle: 'Sedlo',
    seatpost: 'Sedlovka',
    frontLight: 'Přední světlo',
    rearLight: 'Zadní světlo',
    carrier: 'Nosič',
    mudguards: 'Blatníky',
    stand: 'Stojánek',
    lock: 'Zámek rámu',
    weight: 'Hmotnost',
    maxWeight: 'Maximální nosnost',
    intendedUse: 'Určení',
    fieldOfApplication: 'Oblast použití',
    modelSeries: 'Modelová řada',
    colorShopfilter: 'Barva (filtr)',
};

/** Český popisek parametru; neznámý klíč vrací beze změny. */
export function paramLabelCz(key: string): string {
    return PARAM_LABELS_CZ[key] || key;
}

/**
 * Souhrnný český popis položky složený z hlavních parametrů — partner ho může
 * použít rovnou jako popis produktu, místo aby ho skládal z params sám.
 * Hodnoty parametrů (názvy komponent) zůstávají v jazyce výrobce.
 */
export function buildFeedDescription(input: {
    brand: string;
    model: string;
    year?: number;
    category?: string;
    isEbike: boolean;
    /** Kapacita baterie konkrétní varianty (Wh) — u e-kol se liší po variantách. */
    capacity?: string;
    params: Record<string, string>;
}): string {
    const { brand, model, year, category, isEbike, params } = input;
    const s: string[] = [];

    const head = [isEbike ? 'Elektrokolo' : 'Jízdní kolo', brand, model, year ? `(${year})` : '']
        .filter(Boolean).join(' ');
    s.push(`${head}${category ? ` — ${category}` : ''}.`);

    if (isEbike && (params.motor || params.battery || input.capacity || params.capacity)) {
        const motor = params.motor
            ? `Pohon ${params.motor}${params.motorTorque ? ` (${params.motorTorque})` : ''}`
            : '';
        const cap = (input.capacity ? `${input.capacity.replace(/\s*wh$/i, '')} Wh` : '') || params.capacity || '';
        const battery = params.battery || cap
            ? `baterie ${[params.battery, cap && !String(params.battery || '').includes(cap) ? cap : ''].filter(Boolean).join(' ')}`
            : '';
        const joined = [motor, battery].filter(Boolean).join(', ');
        if (joined) s.push(`${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`);
    }

    const gearsPart = params.rearDerailleur || params.shifter || params.derailleurType;
    if (gearsPart) s.push(`Řazení ${gearsPart}${params.gears ? ` (${params.gears})` : ''}.`);

    if (params.fork) s.push(`Vidlice ${params.fork}${params.travelFork ? `, zdvih ${params.travelFork}` : ''}.`);
    if (params.rearSuspension) s.push(`Zadní tlumič ${params.rearSuspension}${params.travelRear ? `, zdvih ${params.travelRear}` : ''}.`);

    const brakePart = params.brakeFront || params.brakes;
    if (brakePart) s.push(`Brzdy ${brakePart}.`);

    if (params.wheelSize) s.push(`Kola ${params.wheelSize}${params.tires ? `, pláště ${params.tires}` : ''}.`);
    if (params.frameMaterial) s.push(`Rám ${params.frameMaterial}.`);
    if (params.weight) s.push(`Hmotnost ${params.weight}${params.maxWeight ? `, nosnost ${params.maxWeight}` : ''}.`);

    return s.join(' ');
}
