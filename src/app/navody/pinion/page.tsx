import type { Metadata } from 'next';
import Link from 'next/link';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Pinion MGU — návod k ovládání, aplikace a nastavení | Biketime.cz',
  description:
    'Kompletní český návod k pohonu Pinion MGU E1.12 / E1.9 v kolech BULLS: ovládání, aplikace FIT E-Bike Control, funkce Smart.Shift (Auto.Shift, Pre.Select, Start.Select), správné řazení, údržba a chybová hlášení.',
  alternates: { canonical: 'https://biketime.cz/navody/pinion' },
  openGraph: {
    title: 'Pinion MGU — návod k ovládání, aplikace a nastavení',
    description:
      'Jak správně ovládat pohon Pinion MGU, jakou aplikaci si stáhnout a jak si ho nastavit. Zpracováno podle oficiálních manuálů Pinion a FIT.',
    url: 'https://biketime.cz/navody/pinion',
    type: 'article',
  },
};

const UPDATED = 'srpen 2026';

const toc = [
  { id: 'co-je-mgu', label: '1. Co je Pinion MGU' },
  { id: 'rychly-start', label: '2. Rychlý start v 10 krocích' },
  { id: 'soucasti', label: '3. Součásti systému — co je Pinion a co FIT' },
  { id: 'ovladani', label: '4. Základní ovládání' },
  { id: 'rezimy', label: '5. Režimy asistence, Boost a asistence vedení' },
  { id: 'razeni', label: '6. Jak správně řadit' },
  { id: 'smartshift', label: '7. Smart.Shift — čtyři automatické funkce' },
  { id: 'aplikace', label: '8. Aplikace FIT E-Bike Control' },
  { id: 'ladeni', label: '9. Doladění motoru v aplikaci' },
  { id: 'menu', label: '10. Nastavení na displeji' },
  { id: 'udrzba', label: '11. Údržba, čištění a servisní intervaly' },
  { id: 'chyby', label: '12. Chybová hlášení a co s nimi' },
  { id: 'omyly', label: '13. Nejčastější omyly' },
  { id: 'predani', label: '14. Checklist pro předání kola zákazníkovi' },
  { id: 'zdroje', label: '15. Oficiální zdroje' },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="guide-section scroll-mt-24 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="mb-5 text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-700">{children}</div>
    </section>
  );
}

function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'tip';
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-blue-200 bg-blue-50 text-blue-950',
    warn: 'border-amber-300 bg-amber-50 text-amber-950',
    tip: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="mb-1 text-sm font-bold uppercase tracking-wide">{title}</p>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function PinionGuidePage() {
  return (
    <main className="guide-page min-h-screen bg-zinc-50 pb-20">
      {/* Hlavička návodu */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="container-custom py-8 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <p className="no-print mb-3 text-sm text-zinc-500">
              <Link href="/" className="hover:text-primary">
                Biketime
              </Link>{' '}
              / <span className="text-zinc-700">Návody</span>
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Pinion MGU E1.12 / E1.9
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                Systém FIT
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                BULLS Vuca EVO
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Pinion MGU: ovládání, aplikace a nastavení
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              Praktický průvodce pohonem Pinion Motor.Gearbox.Unit — jak ho ovládat, jakou aplikaci
              si stáhnout, jak si ho nastavit a na co si dát pozor. Zpracováno podle oficiální
              uživatelské příručky Pinion a provozních návodů systémového partnera FIT.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <PrintButton />
              <p className="text-sm text-zinc-500">Aktualizováno: {UPDATED}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Obsah */}
          <nav className="guide-section rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-500">Obsah</h2>
            <ol className="grid gap-x-8 gap-y-2 text-[15px] text-zinc-700 sm:grid-cols-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="co-je-mgu" title="1. Co je Pinion MGU">
            <p>
              Pinion MGU (Motor.Gearbox.Unit) spojuje elektromotor a planetovou převodovku Pinion do
              jednoho pouzdra ve středu rámu. Kolo tedy nemá přehazovačku ani kazetu — všechny
              převody jsou uzavřené v olejové lázni uvnitř převodovky a řadí se elektronicky.
              Sekundární pohon (řetěz nebo řemen) má jen jeden pastorek vpředu a jeden vzadu.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Parametr</th>
                    <th className="px-4 py-3">MGU E1.12</th>
                    <th className="rounded-r-lg px-4 py-3">MGU E1.9</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Počet převodů</td>
                    <td className="px-4 py-3">12</td>
                    <td className="px-4 py-3">9</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Celkový rozsah</td>
                    <td className="px-4 py-3">600 %</td>
                    <td className="px-4 py-3">568 %</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Odstupňování</td>
                    <td className="px-4 py-3">~17,7 %</td>
                    <td className="px-4 py-3">~24,3 %</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Točivý moment</td>
                    <td className="px-4 py-3">85 Nm</td>
                    <td className="px-4 py-3">85 Nm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Špičkový výkon</td>
                    <td className="px-4 py-3">600 / 800 W</td>
                    <td className="px-4 py-3">600 / 800 W</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Hmotnost</td>
                    <td className="px-4 py-3">~4 100 g</td>
                    <td className="px-4 py-3">~4 000 g</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Q-faktor</td>
                    <td className="px-4 py-3">174 mm</td>
                    <td className="px-4 py-3">174 mm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Praktický důsledek: <strong>řadit lze i za klidu</strong>, při zpětném otáčení klik i
              několik převodů najednou. To je zásadní rozdíl proti klasickému řetězovému řazení a
              většina funkcí Smart.Shift z toho vychází.
            </p>
          </Section>

          <Section id="rychly-start" title="2. Rychlý start v 10 krocích">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Nabij baterii a zkontroluj, že je zasunutá a zajištěná.</li>
              <li>
                Zapni systém <strong>podržením tlačítka zap./vyp. na cca 1 sekundu</strong> (na
                ovládací jednotce v horní rámové trubce).
              </li>
              <li>Zvol režim asistence prstencem na ovladači na řídítkách nebo tlačítky +/−.</li>
              <li>
                Stáhni si aplikaci <strong>FIT E-Bike Control</strong> (App Store / Google Play) a
                založ účet.
              </li>
              <li>
                Připoj kolo v aplikaci pomocí přiložené <strong>FIT Key Card</strong> — menu E-Bikes
                → „+“.
              </li>
              <li>Vyzkoušej ruční řazení páčkami Pinion TE1 na pravé straně řídítek.</li>
              <li>Nastav si v menu rozjezdový převod (Start.Select) a zapni Pre.Select.</li>
              <li>
                Vyzkoušej automatiku: <strong>dlouhý stisk přední páčky TE1 (3 s)</strong> zapne
                Auto.Shift.
              </li>
              <li>V aplikaci si dolaď režimy FLY / FLEX / FLOW / ECO podle svého stylu jízdy.</li>
              <li>
                Prvních 1 000 km je záběh — řazení se postupně zjemní a ztiší. Po 10 000 km nebo
                jednou ročně výměna oleje u prodejce.
              </li>
            </ol>
          </Section>

          <Section id="soucasti" title="3. Součásti systému — co je Pinion a co FIT">
            <p>
              Pohon je dodávaný jako společný systém dvou výrobců. Je dobré vědět, které díly patří
              komu, protože podle toho se řídí i to, kde se co nastavuje a kdo řeší servis.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-2 text-sm font-bold text-zinc-900">Pinion</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>MGU — motor s převodovkou</li>
                  <li>E-Trigger TE1 — řadicí páčky (pravá strana, IP66)</li>
                  <li>Kliky Pinion (jiné se používat nesmí)</li>
                </ul>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-2 text-sm font-bold text-zinc-900">FIT (systémový partner)</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>Master Node — řídicí jednotka v horní rámové trubce</li>
                  <li>FIT Remote — ovladač na řídítkách</li>
                  <li>Baterie, snímač rychlosti, kabeláž</li>
                  <li>FIT Key Card a aplikace FIT E-Bike Control</li>
                </ul>
              </div>
            </div>
            <p>
              <strong>Dvě varianty ovládací jednotky</strong>, se kterými se setkáš:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>FIT Master Node Basic</strong> — bez displeje, stav baterie a stupeň
                asistence signalizují barevné LED v horní rámové trubce. Nastavení se dělá převážně
                v aplikaci; telefon slouží jako rozšířený displej.
              </li>
              <li>
                <strong>FIT Master Node Display</strong> — s malým displejem: rychlost, režim
                asistence, zvolený převod (nebo „A“ / „A+“ při automatice), dojezd, stav baterie,
                hlášení.
              </li>
            </ul>
            <Callout tone="info" title="Servis a podpora">
              <p>
                Pro kola s pohonem Pinion E-Line zajišťuje podporu celého systému{' '}
                <strong>FIT</strong> — je tedy jediným kontaktním místem pro celý pohon. Reklamaci
                vždy řeš přes prodejce, u kterého bylo kolo koupené; ten kontaktuje servis FIT.
                Vadný díl nikdy neposílej bez předchozí domluvy.
              </p>
            </Callout>
          </Section>

          <Section id="ovladani" title="4. Základní ovládání">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Zapnutí / vypnutí:</strong> podrž tlačítko zap./vyp./světlo alespoň 1
                sekundu. Systém jde zapnout jen s dostatečně nabitou baterií. U varianty s LED
                jednotka krátce blikne purpurově. Při delší nečinnosti se systém sám vypne.
              </li>
              <li>
                <strong>Změna asistence:</strong> tlačítky +/− na ovládací jednotce nebo otočením
                prstence na ovladači FIT Remote Pure nahoru/dolů.
              </li>
              <li>
                <strong>Světla:</strong> krátký stisk tlačítka zap./vyp./světlo. Pokud má kolo denní
                svícení, přepínání mezi denním a potkávacím světlem je automatické.
              </li>
              <li>
                <strong>Přepínání obrazovek</strong> (varianta s displejem): podrž tlačítko
                asistence déle než 3 sekundy.
              </li>
              <li>
                <strong>Funkční tlačítko na ovladači</strong> má z výroby přiřazenou funkci Boost;
                jinou funkci lze přiřadit v aplikaci.
              </li>
            </ul>
          </Section>

          <Section id="rezimy" title="5. Režimy asistence, Boost a asistence vedení">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Režim</th>
                    <th className="rounded-r-lg px-4 py-3">Charakter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-zinc-900">FLY</td>
                    <td className="px-4 py-3">
                      Maximální podpora pro sportovní jízdu až do vysokých kadencí.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-zinc-900">FLEX</td>
                    <td className="px-4 py-3">
                      Proměnná podpora přizpůsobená vlastnímu výkonu v celém rozsahu — agilní jízda,
                      e-MTB traily.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-zinc-900">FLOW</td>
                    <td className="px-4 py-3">
                      Úsporná proměnná podpora pro delší túry a mírnější terén.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-zinc-900">ECO</td>
                    <td className="px-4 py-3">Minimální podpora, maximální dojezd.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-zinc-900">OFF</td>
                    <td className="px-4 py-3">
                      Bez podpory motoru.{' '}
                      <strong>
                        Elektronické řazení i funkce palubního počítače zůstávají dostupné.
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong>Boost</strong> — krátkodobé zvýšení podpory na úroveň FLY nezávisle na
              zvoleném režimu. Aktivuje se podržením funkčního tlačítka (nebo prstence nahoru) za
              jízdy, funguje <strong>od 7 km/h</strong> a po rozpoznání alespoň čtvrtiny otáčky
              klik. Trvá, dokud tlačítko držíš. Během asistence vedení Boost nefunguje.
            </p>
            <p>
              <strong>Asistence vedení (Schiebehilfe)</strong> — pro tlačení kola do kopce nebo z
              garáže. Na ovladači FIT Remote Pure: zatlač prstenec nahoru, dokud se neobjeví
              indikace režimu, pak zatlač znovu nahoru a drž — kolo se rozjede. Po uvolnění na déle
              než 5 sekund režim skončí. Rychlost lze měnit páčkami TE1 a základní rychlost se dá
              přednastavit v menu.
            </p>
            <Callout tone="warn" title="Pozor">
              <p>
                Při použití asistence vedení musí mít <strong>obě kola kontakt se zemí</strong> —
                jinak hrozí zranění. Pro šetrnost k pohonu vždy používej první převod.
              </p>
            </Callout>
            <p>
              <strong>Doběh motoru (Nachlauf)</strong> — podpora ještě chvíli pokračuje i poté, co
              přestaneš šlapat. Díky tomu je nástup síly plynulejší při nízkých kadencích a v terénu
              pomůže přes překážku, když na okamžik přestaneš šlapat. Je{' '}
              <strong>zapnutý z výroby a vypnout ho jde jen v aplikaci</strong> FIT E-Bike Control.
            </p>
          </Section>

          <Section id="razeni" title="6. Jak správně řadit">
            <p>
              Řazení je elektronické: krátký stisk páčky okamžitě spustí přeřazení, opakovaným
              stiskem přeskočíš více převodů za sebou. Samotné přeřazení proběhne v okamžiku, kdy se
              kliky dostanou do svislé polohy — tedy tam, kde je zatížení nejmenší. Při nižších
              kadencích systém řadí okamžitě.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Řadit lze i za klidu</strong>, při zpětném otáčení klik i při šlapání.
                Řazení na stojícím kole je k převodovce šetrné.
              </li>
              <li>
                <strong>Nahoru (01 → 12) jde řadit i pod zátěží.</strong> Jen při přechodu mezi
                dílčími převodovkami je vhodné na okamžik ubrat sílu do pedálů — u 12stupňové verze
                při přeřazení <strong>04 → 05</strong> a <strong>08 → 09</strong>, u 9stupňové při{' '}
                <strong>03 → 04</strong> a <strong>06 → 07</strong>.
              </li>
              <li>
                <strong>Dolů (12 → 01) je řazení pod zátěží omezené.</strong> Při příliš velkém
                tlaku na pedál se přeřazení neprovede.
              </li>
              <li>
                Do kopce pomáhá <strong>vyšší kadence</strong> — čím rychleji kliky obíhají, tím
                dřív se přeřazení provede.
              </li>
            </ul>
            <Callout tone="info" title="Co je normální a není závada">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Lupnutí při řazení pod plnou zátěží. Systém je na to konstruovaný a nepoškodí se.
                </li>
                <li>
                  „Propadnutí“ klik zhruba o 10° po přeřazení, než západka zaskočí do dalšího zubu —
                  krátké cuknutí. Běžné a neškodné.
                </li>
                <li>
                  Krátký volnoběh několika stupňů po přeřazení. Při běžné jízdě je nepostřehnutelný,
                  pod velkou zátěží mírně znatelný.
                </li>
                <li>
                  Pokud je zatížení příliš vysoké (např. tlak na pedály za klidu), systém se pokusí
                  řadit po dobu 2 sekund — je slyšet motorek řazení. Když v této chvíli odlehčíš,
                  přeřazení se dokončí.
                </li>
              </ul>
            </Callout>
            <p>
              <strong>Záběh:</strong> během prvních 1 000 km se zlepší mazání a povrchy ozubených
              kol se zaběhnou — řazení pod částečnou zátěží se zjemní a hluk převodovky se sníží.
            </p>
          </Section>

          <Section id="smartshift" title="7. Smart.Shift — čtyři automatické funkce">
            <p>
              Smart.Shift je souhrnný název pro chytré režimy řazení. Můžeš je kombinovat: řadit
              ručně a mít jen přednastavený rozjezdový převod, nechat kolo řadit při volnoběhu, nebo
              přejít na plnou automatiku.
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="mb-1 font-bold text-zinc-900">Start.Select — rozjezdový převod</p>
                <p className="text-sm">
                  Při zastavení kolo automaticky zařadí předem zvolený převod, takže se vždy
                  rozjíždíš z rozumného převodu a šetříš energii. Ideální do města.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="mb-1 font-bold text-zinc-900">Pre.Select — řazení při volnoběhu</p>
                <p className="text-sm">
                  Když nešlapeš, systém průběžně sleduje rychlost a řadí tak, abys mohl kdykoli
                  plynule zabrat. Na klikatém trailu jsi tak vždy ve správném převodu bez jediného
                  stisku páčky. Při zastavení respektuje nastavený rozjezdový převod a{' '}
                  <strong>nikdy nezařadí nižší převod, než je ten nastavený</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-1 font-bold text-zinc-900">Auto.Shift — plná automatika</p>
                <p className="text-sm">
                  Systém řadí zcela sám i při šlapání tak, aby držel nastavenou kadenci. Na displeji
                  se místo čísla převodu zobrazí <strong>„A“</strong>.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    <strong>Zapnutí a vypnutí: dlouhý stisk (3 s) přední páčky TE1</strong> — ne v
                    menu. (Na ovladači FIT Remote E-Shift tlačítkem „A“.) Lze přepínat i za jízdy.
                  </li>
                  <li>
                    Když je Auto.Shift aktivní, <strong>páčky mění cílovou kadenci</strong> (po 5
                    otáčkách/min), nikoli převod. Změna se krátce zobrazí na displeji.
                  </li>
                  <li>Chceš-li řadit ručně, přepni na Auto.Shift.Pro nebo automatiku vypni.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-1 font-bold text-zinc-900">
                  Auto.Shift.Pro — automatika s možností zásahu
                </p>
                <p className="text-sm">
                  Vyvinuto pro sportovní, dynamickou jízdu. Systém řadí sám podle nastavené kadence,
                  ale páčkami TE1 můžeš kdykoli automatiku přebít a zařadit ručně — typicky před
                  krátkým prudkým stoupáním. Na displeji se zobrazí <strong>„A+“</strong>.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    Když přeřadíš ručně, systém si zapamatuje tvoji aktuální kadenci a přizpůsobí jí
                    další automatické řazení.
                  </li>
                  <li>
                    Návrat k původně nastavené kadenci:{' '}
                    <strong>dlouhý stisk (3 s) zadní páčky TE1</strong>.
                  </li>
                </ul>
              </div>
            </div>

            <p>
              U Auto.Shift i Auto.Shift.Pro je{' '}
              <strong>rozjezdový převod ve výchozím stavu aktivní</strong> — při zastavení kolo
              zařadí zvolený převod. Když ho vypneš, automatika při zastavení zařadí první převod.
            </p>
            <Callout tone="info" title="Auto.Shift a starší kola">
              <p>
                Funkce Auto.Shift a Auto.Shift.Pro přišly do MGU aktualizací firmwaru (od září
                2024). Pokud je kolo nemá, je potřeba{' '}
                <strong>aktualizace systému u autorizovaného prodejce</strong>.
              </p>
            </Callout>
          </Section>

          <Section id="aplikace" title="8. Aplikace FIT E-Bike Control">
            <Callout tone="warn" title="Nezaměňovat aplikace">
              <p>
                Pro kola s pohonem <strong>Pinion MGU</strong> (např. BULLS Vuca EVO) se používá
                aplikace <strong>FIT E-Bike Control</strong>. Aplikace „Pinion Smart.Shift“ je
                určená pro mechanické převodovky Pinion C-Line s elektronickým řazením přes
                Bluetooth — s MGU ji nepoužiješ.
              </p>
            </Callout>
            <p className="font-semibold text-zinc-900">Jak kolo připojit</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Stáhni aplikaci <strong>FIT E-Bike Control</strong> z App Store nebo Google Play.
              </li>
              <li>Spusť ji a založ si účet.</li>
              <li>
                V navigaci zvol menu <strong>E-Bikes</strong> a klepni na <strong>„+“</strong> pro
                přidání kola.
              </li>
              <li>
                Postupuj podle pokynů aplikace a spáruj kolo pomocí <strong>FIT Key Card</strong>.
              </li>
            </ol>
            <Callout tone="warn" title="FIT Key Card pečlivě uschovat">
              <p>
                Key Card je identifikační karta kola — její jedinečné ID (technologie SmartX od
                ABUS) zajišťuje bezpečné spojení telefonu s kolem.{' '}
                <strong>Bez karty se kolo do aplikace nepřipojí.</strong> Při ztrátě se dá dokoupit
                v e-shopu FIT za poplatek. Doporučení: kartu neskladovat s kolem a předat ji
                zákazníkovi spolu s vysvětlením, k čemu slouží.
              </p>
            </Callout>
            <p className="font-semibold text-zinc-900">Co aplikace umí</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>aktivace a nastavení všech funkcí Smart.Shift,</li>
              <li>personalizace režimů FLY, FLEX, FLOW a ECO,</li>
              <li>navigace s mapou a plánování tras přes Komoot,</li>
              <li>Find my e-Bike — dohledání kola,</li>
              <li>e-bike pas — přehled o kole na jednom místě,</li>
              <li>připojení hrudního pásu / měřiče tepu,</li>
              <li>telefon jako rozšířený displej,</li>
              <li>
                FIT Digital Key (ochrana proti krádeži) a Drive Screen —{' '}
                <strong>placené funkce</strong>.
              </li>
            </ul>
          </Section>

          <Section id="ladeni" title="9. Doladění motoru v aplikaci">
            <p>
              Aplikace nabízí čtyři parametry, kterými se charakter pohonu dá výrazně změnit.
              Nastavují se pro jednotlivé režimy asistence.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Parametr</th>
                    <th className="rounded-r-lg px-4 py-3">Co dělá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Assistance</td>
                    <td className="px-4 py-3">
                      Procentní navýšení výkonu jezdce. Přímo ovlivňuje sílu i dojezd.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Maximum torque</td>
                    <td className="px-4 py-3">
                      Maximální točivý moment motoru. Znát je hlavně při rozjezdu a v prudkém
                      stoupání.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Dynamics</td>
                    <td className="px-4 py-3">
                      Jak rychle motor rozvine sílu — od komfortního po sportovní charakter.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Torque characteristics</td>
                    <td className="px-4 py-3">
                      Průběh podpory od lineárního po výrazně progresivní (pro režimy FLOW a FLEX).
                      Čím progresivnější, tím citlivěji motor reaguje na výkon jezdce.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="font-semibold text-zinc-900">Doporučení podle typu jezdce</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Turista / delší túry:</strong> jezdi v FLOW s méně progresivní
                charakteristikou a nižším maximálním momentem — nejvyšší dojezd a klidný nástup
                síly.
              </li>
              <li>
                <strong>Trailový jezdec:</strong> FLEX s progresivní charakteristikou a sportovní
                dynamikou — motor reaguje okamžitě na zvýšený tlak do pedálů.
              </li>
              <li>
                <strong>Jezdec, kterému pohon „utíká“:</strong> sniž dynamiku a maximální moment;
                kolo bude předvídatelnější v technickém terénu i při manévrování v nízkých
                rychlostech.
              </li>
            </ul>
          </Section>

          <Section id="menu" title="10. Nastavení na displeji">
            <p>
              U kol s displejem se v menu pohybuješ tlačítky +/− a volbu potvrdíš tlačítkem OK,
              tlačítkem zpět se vrátíš o úroveň výš. Nejdůležitější položky pro Pinion MGU:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Cesta v menu</th>
                    <th className="rounded-r-lg px-4 py-3">Co nastavíš</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Řazení › Smart.Shift</td>
                    <td className="px-4 py-3">
                      Zapnutí/vypnutí Start.Select a Pre.Select, konfigurace Auto.Shift a
                      Auto.Shift.Pro — rozjezdový převod a cílová kadence.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Řazení › Obsazení páček</td>
                    <td className="px-4 py-3">
                      Prohození funkce páček TE1 pro řazení nahoru a dolů podle vlastní preference.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      Moje kolo › Rychlost asistence vedení
                    </td>
                    <td className="px-4 py-3">
                      Základní rychlost asistence vedení (za jízdy ji lze měnit páčkami TE1).
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">O systému › Motor</td>
                    <td className="px-4 py-3">
                      Sériové číslo MGU (na zabudovaném motoru není čitelné) — potřebné pro servis a
                      reklamace.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-zinc-500">
              Přesné názvy položek se liší podle verze firmwaru a jazyka; struktura menu je popsaná
              v návodu k příslušnému ovladači FIT.
            </p>
          </Section>

          <Section id="udrzba" title="11. Údržba, čištění a servisní intervaly">
            <Callout tone="warn" title="Čištění">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Nikdy nepoužívej vysokotlaký ani parní čistič.</strong>
                </li>
                <li>Čisti pouze vodou a neutrálním mýdlem.</li>
                <li>
                  Elektrické díly (E-Trigger, kabeláž MGU) používej a čisti jen se zapojenými
                  konektory nebo nasazenými krytkami.
                </li>
              </ul>
            </Callout>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Úkon</th>
                    <th className="rounded-r-lg px-4 py-3">Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3">Očistit MGU vodou, neutrálním mýdlem a kartáčem</td>
                    <td className="px-4 py-3">
                      po každé jízdě (hlavně v mokru a na posypové soli)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Vyčistit řetěz/řemen, převodník a pastorek, případně kladky napínáku
                    </td>
                    <td className="px-4 py-3">
                      každých 250 km (nebo po každé jízdě v mokru a soli)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Zkontrolovat napnutí řetězu/řemene, případně upravit
                    </td>
                    <td className="px-4 py-3">každých 250 km</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Lehce naolejovat řetěz</td>
                    <td className="px-4 py-3">každých 250 km</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Zkontrolovat opotřebení řetězu/řemene a ozubení, případně vyměnit
                    </td>
                    <td className="px-4 py-3">každých 500 km</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Zkontrolovat dotažení všech šroubů (kromě šroubů skříně převodovky)
                    </td>
                    <td className="px-4 py-3">každých 500 km</td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      Výměna oleje v převodovce (odborně, u prodejce)
                    </td>
                    <td className="px-4 py-3 font-semibold">každých 10 000 km nebo 1× ročně</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="font-semibold text-zinc-900">Kalibrace</p>
            <p>
              MGU si seřízení řazení hlídá samo — ruční doladění není potřeba. Pokud je kalibrace
              nutná, systém si ji vyžádá a spustí sám.{' '}
              <strong>Během kalibrace nesmíš zatěžovat ani otáčet klikami</strong>, jinak se
              přeruší.
            </p>

            <p className="font-semibold text-zinc-900">Kdy je nutná návštěva prodejce</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                při přezutí na plášť výrazně jiného rozměru (jinak displej ukazuje špatnou rychlost
                a posune se i zákonná mez asistence 25 / 45 km/h),
              </li>
              <li>
                při změně počtu zubů zadní řemenice nebo pastorku (spustí se detekce manipulace),
              </li>
              <li>při výměně oleje (každých 10 000 km),</li>
              <li>při aktualizaci systému.</li>
            </ul>

            <Callout tone="warn" title="Detekce manipulace (tuning)">
              <p>
                Pohon má zákonem předepsanou detekci manipulace. Při nepravděpodobných hodnotách
                dostane jezdec varování a asistence se vypne. Pokud se ujede{' '}
                <strong>více než 100 km s detekovanou manipulací, asistence se vypne trvale</strong>{' '}
                a MGU lze resetovat pouze přes servis FIT.
              </p>
            </Callout>

            <p className="font-semibold text-zinc-900">Sekundární pohon a kliky</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Vpředu je povolená pouze <strong>řemenice 39T CDX (ne SL!)</strong> nebo{' '}
                <strong>pastorek 30T Longlife</strong>. Zadní řemenici/pastorek s jiným počtem zubů
                smí vyměnit jen odborný prodejce.
              </li>
              <li>
                MGU má standardní osu klik Pinion — <strong>použít lze jen kliky Pinion</strong>,
                výrobky jiných značek nejsou povolené.
              </li>
            </ul>

            <p className="font-semibold text-zinc-900">Maximální utahovací momenty</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Spoj</th>
                    <th className="rounded-r-lg px-4 py-3">Moment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3">Upevňovací šrouby převodovky</td>
                    <td className="px-4 py-3">10 Nm, se středně silným zajišťovačem závitů</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Centrální šrouby klik</td>
                    <td className="px-4 py-3">10 Nm, se středně silným zajišťovačem závitů</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Svěrné šrouby klik</td>
                    <td className="px-4 py-3">10 Nm, s podložkou SCHNORR®, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Matice pastorku / řemenice</td>
                    <td className="px-4 py-3">40 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Vypouštěcí šroub oleje</td>
                    <td className="px-4 py-3">3 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Upevňovací šrouby napínáku řetězu / řemene</td>
                    <td className="px-4 py-3">4 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Kladka napínáku řemene</td>
                    <td className="px-4 py-3">4 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Kladky napínáku řetězu</td>
                    <td className="px-4 py-3">2 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Upevňovací šroub E-Triggeru TE1</td>
                    <td className="px-4 py-3">3 Nm, nasucho</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Šrouby univerzálního rozhraní na MGU (kryty, vodítko řetězu apod.)
                    </td>
                    <td className="px-4 py-3">4 Nm, nasucho</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="chyby" title="12. Chybová hlášení a co s nimi">
            <p>
              Hlášení se na displeji zobrazí přes celou šířku v rámečku. Potvrdíš je stiskem
              libovolného tlačítka; pokud příčina trvá, zůstane ikona v levém horním rohu. Při více
              hlášeních se po potvrzení zobrazí další.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">Hlášení</th>
                    <th className="rounded-r-lg px-4 py-3">Význam a co dělat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">4D03</td>
                    <td className="px-4 py-3">
                      Odlehči pedály pro asistenci vedení — kolo potřebuje zařadit příslušný převod.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">4D08</td>
                    <td className="px-4 py-3">
                      Řazení potřebuje rekalibraci. Zastav a odlehči pedály — MGU spustí kalibraci
                      automaticky.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">52-02 / 52-03</td>
                    <td className="px-4 py-3">
                      Nutná kalibrace. Spusť ji z menu displeje a postupuj podle pokynů.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Přehřátí motoru</td>
                    <td className="px-4 py-3">
                      Snížený výkon asistence kvůli ochraně motoru. Uber a nech pohon vychladnout.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Ochranný režim baterie</td>
                    <td className="px-4 py-3">
                      Nízký stav nabití nebo nízká teplota baterie — snížený výkon. Nabij baterii,
                      případně ji nech ohřát na pokojovou teplotu.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Servisní interval</td>
                    <td className="px-4 py-3">
                      Kolo je potřeba co nejdříve předat prodejci k údržbě.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Nebezpečí náledí</td>
                    <td className="px-4 py-3">Teplota pod 4 °C — jeď opatrně.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">Nízký tlak v pláštích</td>
                    <td className="px-4 py-3">
                      Zkontroluj tlak (jen u kol s volitelnými snímači tlaku).
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      Varování / chyba systému
                    </td>
                    <td className="px-4 py-3">
                      Restartuj systém. Pokud problém přetrvává, kontaktuj prodejce.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-zinc-500">
              Kompletní seznam chybových kódů je v provozním návodu k příslušnému ovladači FIT.
            </p>
          </Section>

          <Section id="omyly" title="13. Nejčastější omyly">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>„Stáhnu si aplikaci Pinion.“</strong> — Pro MGU se používá FIT E-Bike
                Control. Aplikace Pinion Smart.Shift je pro mechanické převodovky C-Line.
              </li>
              <li>
                <strong>„Auto.Shift hledám v menu.“</strong> — Zapíná se dlouhým stiskem přední
                páčky TE1 (3 s). V menu se jen konfiguruje.
              </li>
              <li>
                <strong>„Páčky mi nefungují.“</strong> — Při aktivním Auto.Shift páčky nemění
                převod, ale cílovou kadenci. Pro ruční zásah je potřeba Auto.Shift.Pro.
              </li>
              <li>
                <strong>„Převodovka lupe, je vadná.“</strong> — Lupnutí pod plnou zátěží a lehké
                propadnutí klik po přeřazení jsou konstrukční vlastnosti, ne závada.
              </li>
              <li>
                <strong>„Ztratil jsem Key Card, to nevadí.“</strong> — Bez ní kolo nespáruješ s
                aplikací; náhrada je placená.
              </li>
              <li>
                <strong>„Umyju to wapkou.“</strong> — Vysokotlaký čistič může poškodit těsnění a
                elektroniku.
              </li>
              <li>
                <strong>„V režimu OFF nejde řadit.“</strong> — Jde. Elektronické řazení funguje i
                bez asistence.
              </li>
            </ul>
          </Section>

          <Section id="predani" title="14. Checklist pro předání kola zákazníkovi">
            <p className="text-sm text-zinc-500">
              Doporučený postup pro prodejce — pět minut při předání ušetří většinu pozdějších
              dotazů.
            </p>
            <ul className="space-y-2">
              {[
                'Předat FIT Key Card a vysvětlit, že je to „klíč“ ke kolu pro aplikaci — neztratit, neskladovat s kolem.',
                'Společně nainstalovat FIT E-Bike Control a spárovat kolo přímo na prodejně.',
                'Ukázat zapnutí (podržet 1 s), přepínání asistence a světla.',
                'Vysvětlit rozdíl mezi řazením Pinion a klasickou přehazovačkou — řazení za klidu, více převodů najednou.',
                'Upozornit na krátké ubrání síly při přeřazení mezi dílčími převodovkami (04→05 a 08→09 u 12st.).',
                'Předvést Auto.Shift dlouhým stiskem přední páčky a ukázat „A“ na displeji.',
                'Nastavit rozjezdový převod a zapnout Pre.Select podle typu jízdy zákazníka.',
                'Zmínit záběh 1 000 km — řazení se zjemní, hluk klesne.',
                'Upozornit na výměnu oleje po 10 000 km nebo jednou ročně.',
                'Zakázat vysokotlaký čistič a doporučit očištění po jízdě v mokru a soli.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-300 text-[10px] text-zinc-400">
                    ✓
                  </span>
                  <span className="text-[15px]">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="zdroje" title="15. Oficiální zdroje">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <a
                  href="https://pinion.eu/en/startup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  pinion.eu/en/startup
                </a>{' '}
                — video „Start-up &amp; Good to know“ k prvnímu seznámení s pohonem
              </li>
              <li>
                <a
                  href="https://pinion.eu/wp-content/uploads/2024/09/MGU_Benutzerhandbuch_2024-09-26_Web.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Uživatelská příručka Pinion E-Drive System (PDF, DE/EN/FR)
                </a>
              </li>
              <li>
                <a
                  href="https://www.pinion.eu/en/e-drive/smartshift-functions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  pinion.eu — přehled funkcí Smart.Shift
                </a>
              </li>
              <li>
                <a
                  href="https://pinion.eu/en/service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  pinion.eu/en/service
                </a>{' '}
                — FAQ, řešení problémů a servisní videa
              </li>
              <li>
                <a
                  href="https://fit-ebike.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  fit-ebike.com
                </a>{' '}
                — provozní návody k ovladačům FIT, displejům a bateriím
              </li>
            </ul>
            <Callout tone="info" title="Potřebuješ poradit?">
              <p>
                Technická podpora pro partnery Biketime:{' '}
                <a href="mailto:info@biketime.cz" className="font-semibold underline">
                  info@biketime.cz
                </a>{' '}
                nebo{' '}
                <a href="tel:+420604263221" className="font-semibold underline">
                  +420 604 263 221
                </a>
                .
              </p>
            </Callout>
            <p className="text-xs leading-relaxed text-zinc-400">
              Tento návod je zpracovaný podle oficiálních materiálů Pinion GmbH a FIT (Smartscale
              NewCo AG) a slouží jako přehledový průvodce. Vždy platí originální dokumentace
              přiložená ke konkrétnímu kolu. Pinion, MGU, Smart.Shift, Auto.Shift, FIT a BULLS jsou
              ochranné známky příslušných vlastníků.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
