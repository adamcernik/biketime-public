// =============================================================================
// Color Utils — mapování názvů barev z ZEG CSV na hex kódy
// =============================================================================

/** Slovník klíčových slov → hex barva (DE + EN) */
const COLOR_KEYWORDS: Record<string, string> = {
  // German
  schwarz: '#1a1a1a',
  weiß: '#ffffff',
  weiss: '#ffffff',
  rot: '#dc2626',
  blau: '#2563eb',
  grün: '#16a34a',
  gruen: '#16a34a',
  grau: '#6b7280',
  gelb: '#eab308',
  braun: '#78350f',
  silber: '#b0b0b0',
  lila: '#9333ea',
  oliv: '#65a30d',
  koralle: '#f97316',
  creme: '#fffdd0',
  bordeaux: '#722f37',
  petrol: '#0d9488',
  titan: '#8b8e94',
  anthrazit: '#383838',
  rosa: '#ec4899',
  türkis: '#06b6d4',
  tuerkis: '#06b6d4',
  kupfer: '#b87333',
  // English
  black: '#1a1a1a',
  white: '#ffffff',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  gray: '#6b7280',
  grey: '#6b7280',
  yellow: '#eab308',
  brown: '#78350f',
  silver: '#b0b0b0',
  gold: '#d4a017',
  purple: '#9333ea',
  orange: '#ea580c',
  teal: '#0d9488',
  olive: '#65a30d',
  sand: '#c2b280',
  beige: '#d2b48c',
  coral: '#f97316',
  navy: '#1e3a5f',
  cream: '#fffdd0',
  burgundy: '#722f37',
  wine: '#722f37',
  emerald: '#059669',
  titanium: '#8b8e94',
  chrome: '#c0c0c0',
  anthracite: '#383838',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  pink: '#ec4899',
  aqua: '#06b6d4',
  copper: '#b87333',
  mint: '#86efac',
  sky: '#38bdf8',
  lime: '#84cc16',
  indigo: '#6366f1',
  charcoal: '#36454f',
  ivory: '#fffff0',
  platinum: '#a0a0a0',
  champagne: '#f7e7ce',
  midnight: '#191970',
  stone: '#8a8a7b',
  slate: '#64748b',
  smoke: '#848884',
  fog: '#b8bab5',
  desert: '#c9a86c',
  arctic: '#d0e8f2',
  storm: '#4a4a5a',
  sunset: '#e8734a',
  moss: '#4a6741',
  ocean: '#1a5276',
  forest: '#228b22',
  mahagoni: '#4e1609',
  mahogany: '#4e1609',
  cobalt: '#0047ab',
  ruby: '#9b111e',
  sapphire: '#0f52ba',
  jade: '#00a86b',
  mocha: '#6f4e37',
  caramel: '#a0522d',
  khaki: '#bdb76b',
  terracotta: '#cc5533',
};

/** Modifikátory povrchu — strip z názvu, nemění barvu */
const FINISH_MODIFIERS = [
  'matt', 'matte', 'metallic', 'glossy', 'gloss', 'shiny', 'satin',
  'pearl', 'transparent', 'flat', 'raw', 'polished', 'brushed', 'frozen',
];

/** Modifikátory jasu — ovlivňují výslednou barvu */
const DARKEN_MODIFIERS = ['dark', 'dunkel', 'deep'];
const LIGHTEN_MODIFIERS = ['light', 'hell', 'pale', 'pastel', 'soft'];
const NEON_MODIFIERS = ['neon', 'bright', 'vivid', 'electric'];

// -----------------------------------------------------------------------------
// Hex color manipulation helpers
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function darkenHex(hex: string, amount = 0.2): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lightenHex(hex: string, amount = 0.2): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

function brightenHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  if (max === 0) return '#00ff00'; // fallback for pure black
  const factor = 255 / max;
  return rgbToHex(
    Math.min(255, r * factor * 1.1),
    Math.min(255, g * factor * 1.1),
    Math.min(255, b * factor * 1.1),
  );
}

// -----------------------------------------------------------------------------
// Main function
// -----------------------------------------------------------------------------

/**
 * Odhadne hex barvu z názvu barvy ze ZEG CSV.
 * Rozumí německým i anglickým názvům, modifikátorům (matt, dark, neon...).
 * Vrací null pokud nedokáže rozpoznat.
 */
export function guessHexFromName(name: string): string | null {
  if (!name) return null;

  // Normalizace
  let normalized = name.toLowerCase().trim();

  // Multi-color: "matt black / neon yellow" → použít první
  if (normalized.includes('/')) {
    normalized = normalized.split('/')[0].trim();
  }
  if (normalized.includes('&')) {
    normalized = normalized.split('&')[0].trim();
  }

  // Rozdělit na slova
  const words = normalized.split(/[\s\-_]+/).filter(Boolean);

  // Detekce modifikátorů
  let shouldDarken = false;
  let shouldLighten = false;
  let shouldNeon = false;

  const colorWords: string[] = [];

  for (const word of words) {
    if (FINISH_MODIFIERS.includes(word)) continue; // strip
    if (DARKEN_MODIFIERS.includes(word)) { shouldDarken = true; continue; }
    if (LIGHTEN_MODIFIERS.includes(word)) { shouldLighten = true; continue; }
    if (NEON_MODIFIERS.includes(word)) { shouldNeon = true; continue; }
    colorWords.push(word);
  }

  // Hledání v slovníku — zkusit celý zbytek, pak jednotlivá slova
  let baseHex: string | null = null;

  // Zkusit celý combined string
  const combined = colorWords.join('');
  if (COLOR_KEYWORDS[combined]) {
    baseHex = COLOR_KEYWORDS[combined];
  }

  // Zkusit dvouslovnou kombinaci
  if (!baseHex && colorWords.length >= 2) {
    const twoWord = colorWords.slice(0, 2).join('');
    if (COLOR_KEYWORDS[twoWord]) {
      baseHex = COLOR_KEYWORDS[twoWord];
    }
  }

  // Zkusit jednotlivá slova (od konce — barva je obvykle poslední)
  if (!baseHex) {
    for (let i = colorWords.length - 1; i >= 0; i--) {
      if (COLOR_KEYWORDS[colorWords[i]]) {
        baseHex = COLOR_KEYWORDS[colorWords[i]];
        break;
      }
    }
  }

  if (!baseHex) return null;

  // Aplikovat modifikátory
  if (shouldNeon) return brightenHex(baseHex);
  if (shouldDarken) return darkenHex(baseHex, 0.25);
  if (shouldLighten) return lightenHex(baseHex, 0.3);

  return baseHex;
}
