/**
 * Vygeneruje PDF návodu Pinion do public/downloads/ přes headless Chrome —
 * stejné vykreslení jako tisk stránky (print CSS, bez hlaviček prohlížeče).
 *
 * Spusť po každé obsahové změně /navody/pinion a commitni výsledek:
 *   node scripts/generate-pinion-pdf.mjs                     # z produkce
 *   node scripts/generate-pinion-pdf.mjs http://localhost:3000  # z dev serveru
 */
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'https://www.biketime.cz';
const URL = `${BASE.replace(/\/$/, '')}/navody/pinion`;
const OUT = path.join(ROOT, 'public/downloads/pinion-mgu-navod-biketime.pdf');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('Chrome nenalezen — nainstaluj Google Chrome nebo uprav CHROME_CANDIDATES.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
execFileSync(chrome, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${OUT}`,
  URL,
], { stdio: 'inherit' });
console.log(`Hotovo: ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} kB) z ${URL}`);
