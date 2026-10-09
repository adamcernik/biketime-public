import Link from 'next/link';
import { PARAM_LABELS_CZ } from '@/lib/feeds/paramLabels';

// Integrační dokumentace produktových feedů — statická referenční stránka
// pro vývojáře partnerských e-shopů. Datový slovník parametrů se generuje
// z PARAM_LABELS_CZ, takže je vždy v souladu se skutečným výstupem feedu.

export const metadata = {
  title: 'Dokumentace produktových feedů | Biketime.cz',
  robots: { index: false, follow: false },
};

const FIELDS: { field: string; type: string; desc: string }[] = [
  { field: 'item_id / itemId', type: 'string', desc: 'Kód varianty (artikl ZEG, NRLF) — unikátní párovací klíč položky. Doporučený primární klíč pro import.' },
  { field: 'product_id / productId', type: 'string', desc: 'ID produktu (model) — všechny varianty jednoho modelu sdílejí stejné product_id. V Heureka formátu jako ITEMGROUP_ID.' },
  { field: 'ean', type: 'string', desc: 'EAN varianty (pokud je znám).' },
  { field: 'brand', type: 'string', desc: 'Značka (např. BULLS).' },
  { field: 'model', type: 'string', desc: 'Název modelu bez značky a ročníku.' },
  { field: 'name', type: 'string', desc: 'Složený název: značka, model, ročník, barva, kapacita baterie, velikost. Vhodné jako název položky v e-shopu.' },
  { field: 'year', type: 'number', desc: 'Modelový ročník.' },
  { field: 'category', type: 'string', desc: 'Kategorie (např. Celopéra, Trek, Město…).' },
  { field: 'ebike / isEbike', type: '0/1, boolean', desc: 'Zda jde o elektrokolo.' },
  { field: 'color', type: 'string', desc: 'Barva varianty (v jazyce výrobce).' },
  { field: 'size', type: 'string', desc: 'Velikost rámu (S/M/L… nebo cm podle typu kola).' },
  { field: 'battery_wh / capacity', type: 'string', desc: 'Kapacita baterie ve Wh (jen e-kola). Varianty jednoho modelu se mohou kapacitou lišit — liší se pak i cena.' },
  { field: 'url', type: 'string', desc: 'Odkaz na detail produktu na biketime.cz.' },
  { field: 'image / images', type: 'string[]', desc: 'URL obrázků (CDN výrobce). V CSV je první obrázek ve sloupci image, všechny pak v images oddělené svislítkem |.' },
  { field: 'price_moc_czk_vat / mocCzkVat', type: 'number', desc: 'Doporučená maloobchodní cena (MOC) v Kč včetně DPH.' },
  { field: 'price_voc_czk / vocCzk', type: 'number', desc: 'VAŠE nákupní (dealerská) cena v Kč bez DPH podle vaší cenové hladiny. Důvěrný údaj — feed nesdílejte.' },
  { field: 'availability', type: 'string', desc: 'Kód dostupnosti — viz tabulka níže.' },
  { field: 'availability_text / availabilityText', type: 'string', desc: 'Český popisek dostupnosti.' },
  { field: 'description', type: 'string', desc: 'Souhrnný český popis složený z hlavních parametrů (pohon, baterie, řazení, odpružení, brzdy, kola, hmotnost). Lze použít rovnou jako popis produktu.' },
  { field: 'params', type: 'objekt / <param>', desc: 'Kompletní technické parametry. Klíč (name) je technický identifikátor, label_cz (XML) resp. paramLabels (JSON) nese český název, value hodnotu od výrobce (zpravidla anglicky).' },
];

const AVAILABILITY: { code: string; text: string; desc: string }[] = [
  { code: 'ours', text: 'skladem', desc: 'Skladem u Biketime — expedice ihned.' },
  { code: 'zeg-stock', text: 'u výrobce', desc: 'Skladem u výrobce (ZEG) — dodání cca do týdne.' },
  { code: 'zeg-low', text: 'u výrobce omezeně', desc: 'U výrobce posledních pár kusů.' },
  { code: 'zeg-date', text: 'u výrobce později', desc: 'U výrobce s pozdějším termínem naskladnění.' },
  { code: 'on-order', text: 'na objednávku', desc: 'Na objednávku — termín po ověření.' },
  { code: 'none', text: 'nedostupné', desc: 'Aktuálně nedostupné — nelze objednat. Nezobrazujte / skryjte.' },
];

function Code({ children }: { children: string }) {
  return <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] text-zinc-800">{children}</code>;
}

export default function FeedDokumentacePage() {
  const paramRows = Object.entries(PARAM_LABELS_CZ);
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm text-zinc-500">
        <Link href="/zona/feedy" className="hover:text-primary">Produktové feedy</Link>
        {' '}/ <span className="text-zinc-700">Dokumentace</span>
      </p>
      <h1 className="text-2xl font-bold text-zinc-900">Integrační dokumentace feedů</h1>
      <p className="mt-1 mb-8 text-sm text-zinc-500">
        Referenční popis produktových feedů pro napojení vašeho e-shopu. URL feedu s vaším
        tokenem najdete na stránce <Link href="/zona/feedy" className="text-primary hover:underline">Produktové feedy</Link>.
      </p>

      <section className="mb-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Základy</h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-600">
          <li><strong>URL:</strong> <Code>{'https://biketime.cz/api/feeds/catalog?token=VÁŠ_TOKEN&format=xml'}</Code></li>
          <li><strong>Formáty</strong> (parametr <Code>format</Code>): <Code>xml</Code> (výchozí), <Code>json</Code>, <Code>csv</Code> (středník, UTF-8 s BOM), <Code>heureka</Code> (dialekt Heureka XML pro Shoptet a spol.).</li>
          <li><strong>Autentizace:</strong> pouze tokenem v URL — žádné přihlášení. Token je tajný; při úniku si na stránce feedů vygenerujte nový (starý okamžitě přestane platit).</li>
          <li><strong>Položka = varianta.</strong> Jedna položka odpovídá jedné objednatelné variantě (kombinace barva + velikost + kapacita baterie). Varianty jednoho modelu spojíte přes <Code>product_id</Code>.</li>
          <li><strong>Ceny:</strong> <Code>price_moc_czk_vat</Code> je doporučená MOC s DPH, <Code>price_voc_czk</Code> vaše nákupní cena bez DPH podle vaší hladiny. Heureka formát VOC záměrně neobsahuje (je určen pro maloobchodní výdej).</li>
          <li><strong>Frekvence stahování:</strong> data se mění řádově denně — doporučujeme stahovat 1–4× denně. Limit je 60 požadavků za hodinu na token.</li>
          <li><strong>Změny formátu:</strong> nová pole přidáváme zpětně kompatibilně (v CSV vždy jen nové sloupce na konec). Existující pole nepřejmenováváme.</li>
        </ul>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Pole položky</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">Pole (XML/CSV / JSON)</th>
                <th className="py-2 pr-4">Typ</th>
                <th className="py-2">Význam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {FIELDS.map((f) => (
                <tr key={f.field} className="align-top">
                  <td className="py-2 pr-4 font-mono text-[13px] text-zinc-800 whitespace-nowrap">{f.field}</td>
                  <td className="py-2 pr-4 text-zinc-500 whitespace-nowrap">{f.type}</td>
                  <td className="py-2 text-zinc-600">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Kódy dostupnosti</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">availability</th>
                <th className="py-2 pr-4">availability_text</th>
                <th className="py-2">Význam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {AVAILABILITY.map((a) => (
                <tr key={a.code} className="align-top">
                  <td className="py-2 pr-4 font-mono text-[13px] text-zinc-800">{a.code}</td>
                  <td className="py-2 pr-4 text-zinc-600 whitespace-nowrap">{a.text}</td>
                  <td className="py-2 text-zinc-600">{a.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Dostupnost se řídí stejným pravidlem jako objednávky na biketime.cz — položku se stavem{' '}
          <Code>none</Code> nelze objednat.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Technické parametry (params)</h2>
        <p className="mb-4 text-[15px] leading-relaxed text-zinc-600">
          Každá položka nese kompletní technické parametry. V XML má každý{' '}
          <Code>{'<param>'}</Code> prvky <Code>name</Code> (technický klíč), <Code>label_cz</Code>{' '}
          (český název) a <Code>value</Code>. V JSON jsou parametry v objektu <Code>params</Code>{' '}
          (klíč → hodnota) a české názvy klíčů jednou pro celý feed v objektu{' '}
          <Code>paramLabels</Code>. Hodnoty (názvy komponent) zůstávají v jazyce výrobce.
          Pokud nechcete parametry mapovat, použijte hotové pole <Code>description</Code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">Klíč</th>
                <th className="py-2">Český název</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paramRows.map(([key, label]) => (
                <tr key={key}>
                  <td className="py-1.5 pr-4 font-mono text-[13px] text-zinc-800">{key}</td>
                  <td className="py-1.5 text-zinc-600">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Ukázka položky (XML)</h2>
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-[13px] leading-relaxed text-zinc-100">{`<item>
  <item_id>525907850744</item_id>
  <product_id>bulls-vuca-evo-am-2-2025</product_id>
  <ean>4063518363254</ean>
  <brand>BULLS</brand><model>VUCA EVO AM 2</model>
  <name>BULLS VUCA EVO AM 2 2025 dark chrome silver 791 Wh vel. M</name>
  <year>2025</year><category>Celopéra</category><ebike>1</ebike>
  <color>dark chrome silver</color><size>M</size><battery_wh>791 Wh</battery_wh>
  <url>https://biketime.cz/catalog/bulls-vuca-evo-am-2-2025</url>
  <images><image>https://assets.zeg.de/…/ZEG_525907850741.jpg</image></images>
  <price_moc_czk_vat>229499</price_moc_czk_vat>
  <price_voc_czk>145899</price_voc_czk>
  <availability>ours</availability><availability_text>skladem</availability_text>
  <description>Elektrokolo BULLS VUCA EVO AM 2 (2025) — Celopéra. Pohon FIT PINION MGU E1.12 (85 Nm), baterie FIT UltraCore 791 Wh. …</description>
  <params>
    <param><name>motor</name><label_cz>Motor</label_cz><value>FIT PINION MGU E1.12</value></param>
    …
  </params>
</item>`}</pre>
        <p className="mt-4 text-sm text-zinc-500">
          Dotazy k integraci rádi zodpovíme na{' '}
          <a href="mailto:info@biketime.cz" className="text-primary hover:underline">info@biketime.cz</a>.
        </p>
      </section>
    </div>
  );
}
