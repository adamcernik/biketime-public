import React from 'react';

const proseStyles = [
    'prose prose-zinc max-w-none',
    'prose-p:leading-relaxed',
    'prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-4',
    'prose-ul:my-5 prose-li:my-2 prose-li:leading-relaxed marker:prose-li:text-zinc-400',
    'prose-strong:text-zinc-900',
    'prose-a:text-red-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline',
].join(' ');

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-zinc-50 py-12 md:py-20">
            <div className="container-custom max-w-3xl">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100">
                    <header className="mb-10 pb-8 border-b border-zinc-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 mb-3">
                            Právní informace
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                            Zásady ochrany osobních údajů
                        </h1>
                        <p className="mt-4 text-sm text-zinc-500">Platné od 25. 11. 2025</p>
                    </header>

                    <div className={proseStyles}>
                        <p className="lead">
                            Vážení zákazníci, velmi si vážíme vaší důvěry a ochrana vašich osobních údajů je pro nás prioritou.
                            Níže naleznete informace o tom, jaké údaje shromažďujeme a jak s nimi nakládáme v souladu s nařízením GDPR.
                        </p>

                        <h2>1. Správce osobních údajů</h2>
                        <p>Správcem vašich osobních údajů je společnost:</p>
                        <div className="not-prose my-6 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-5 text-sm leading-relaxed text-zinc-700">
                            <p className="font-semibold text-zinc-900">Biketime s.r.o.</p>
                            <p>K dolům 1924/42, 143 00 Praha 4</p>
                            <p>IČO: 03269787</p>
                            <p>
                                E-mail:{' '}
                                <a href="mailto:info@biketime.cz" className="font-medium text-red-600 hover:underline">
                                    info@biketime.cz
                                </a>
                            </p>
                        </div>

                        <h2>2. Jaké údaje shromažďujeme</h2>
                        <p>
                            Při používání našeho webu můžeme shromažďovat následující údaje:
                        </p>
                        <ul>
                            <li><strong>Registrační a účetní údaje:</strong> Pokud si jako prodejce zřídíte účet do velkoobchodní sekce, zpracováváme jméno a příjmení kontaktní osoby, e-mailovou adresu, telefon, název firmy a její adresu, případně IČO. Při přihlášení přes Google získáváme z vašeho účtu jméno, e-mail a profilovou fotografii.</li>
                            <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, operační systém, datum a čas návštěvy (prostřednictvím logů serveru a analytických nástrojů).</li>
                            <li><strong>Údaje o poloze:</strong> Pokud využijete funkci &quot;Najít nejbližší obchod&quot;, zpracováváme vaši aktuální polohu pouze pro účel vyhledání prodejen. Tato data neukládáme.</li>
                            <li><strong>Kontaktní údaje:</strong> Pokud nás kontaktujete e-mailem nebo telefonicky, zpracováváme vaše kontaktní údaje za účelem vyřízení vašeho dotazu.</li>
                        </ul>

                        <h2>3. Účel a právní základ zpracování</h2>
                        <p>Vaše údaje zpracováváme za následujícími účely a na těchto právních základech:</p>
                        <ul>
                            <li><strong>Vedení velkoobchodního účtu a B2B spolupráce</strong> (registrace prodejce, ověření a schválení účtu, komunikace) — právním základem je plnění smlouvy, resp. provedení opatření před jejím uzavřením (čl. 6 odst. 1 písm. b GDPR).</li>
                            <li><strong>Zajištění technického chodu a bezpečnosti webových stránek</strong> — právním základem je náš oprávněný zájem (čl. 6 odst. 1 písm. f GDPR).</li>
                            <li><strong>Analýza návštěvnosti a zlepšování našich služeb</strong> — pouze na základě vašeho souhlasu (čl. 6 odst. 1 písm. a GDPR), který udělujete prostřednictvím cookie lišty.</li>
                            <li><strong>Zobrazení nejbližších prodejen na mapě</strong> — na základě vaší žádosti (čl. 6 odst. 1 písm. b GDPR).</li>
                            <li><strong>Komunikace se zákazníky</strong> — na základě oprávněného zájmu, resp. plnění smlouvy.</li>
                        </ul>

                        <h2>4. Doba uchování údajů</h2>
                        <ul>
                            <li><strong>Registrační a účetní údaje</strong> uchováváme po dobu trvání velkoobchodní spolupráce a následně po dobu nezbytnou k ochraně našich práv a ke splnění zákonných povinností.</li>
                            <li><strong>Analytické údaje</strong> uchováváme po dobu nezbytnou pro vyhodnocení návštěvnosti, nejdéle však po dobu stanovenou nastavením příslušného nástroje.</li>
                            <li><strong>Technické logy</strong> uchováváme po omezenou dobu nezbytnou pro zajištění bezpečnosti a provozu.</li>
                            <li>Souhlas se zpracováním můžete kdykoli odvolat; tím není dotčena zákonnost zpracování před jeho odvoláním.</li>
                        </ul>

                        <h2>5. Příjemci a zpracovatelé</h2>
                        <p>
                            Vaše údaje nepředáváme třetím stranám za účelem marketingu. K naplnění výše uvedených účelů
                            však využíváme spolehlivé poskytovatele služeb (zpracovatele), kteří pro nás údaje zpracovávají
                            na základě smluv o zpracování osobních údajů:
                        </p>
                        <ul>
                            <li><strong>Google / Firebase</strong> (Google Ireland Ltd.) — přihlašování a databáze účtů.</li>
                            <li><strong>Resend</strong> — odesílání transakčních e-mailů (potvrzení registrace, schválení účtu).</li>
                            <li><strong>PostHog</strong> — analytika návštěvnosti a nahrávání relací (pouze s vaším souhlasem).</li>
                            <li><strong>Vercel</strong> — hosting a provoz webových stránek.</li>
                            <li><strong>Google Maps</strong> (Google Ireland Ltd.) — zobrazení map a vyhledání prodejen.</li>
                        </ul>
                        <p>
                            Analytická data ve službě PostHog zpracováváme na serverech v Evropské unii (EU instance).
                            Někteří další poskytovatelé (např. hosting) mohou údaje zpracovávat i mimo Evropský hospodářský
                            prostor; v takovém případě je přenos zajištěn na základě odpovídajících záruk dle GDPR
                            (zejména standardních smluvních doložek schválených Evropskou komisí).
                        </p>

                        <h2>6. Soubory Cookie</h2>
                        <p>
                            Náš web používá soubory cookie. Cookie jsou malé textové soubory, které se ukládají do vašeho zařízení.
                        </p>
                        <ul>
                            <li><strong>Nezbytné cookies:</strong> Jsou nutné pro fungování webu (např. uložení vašeho souhlasu s cookies nebo udržení přihlášení). Tyto cookies se ukládají bez nutnosti souhlasu.</li>
                            <li><strong>Analytické cookies:</strong> Pomáhají nám měřit návštěvnost a analyzovat chování uživatelů na webu. Využíváme službu PostHog, která nám umožňuje analyzovat průchod webem a nahrávat relace (session recording) za účelem odhalování chyb a zlepšování použitelnosti. U nepřihlášených návštěvníků zpracováváme tyto údaje pseudonymizovaně, tedy bez přímých identifikátorů. Pokud jste přihlášeni do velkoobchodního účtu, přiřazujeme analytická data k vašemu účtu (jméno kontaktní osoby, název firmy a role), abychom rozuměli tomu, jak partneři web používají; vaši e-mailovou adresu do analytického nástroje nepředáváme. Tyto nástroje aktivujeme až poté, co k tomu udělíte souhlas.</li>
                        </ul>
                        <p>
                            Nastavení cookies můžete kdykoli změnit prostřednictvím odkazu „Spravovat cookies&quot; v patičce webu
                            nebo v nastavení svého prohlížeče.
                        </p>

                        <h2>7. Vaše práva</h2>
                        <p>V souvislosti se zpracováním osobních údajů máte právo:</p>
                        <ul>
                            <li>Požadovat přístup k vašim osobním údajům.</li>
                            <li>Požadovat opravu nebo výmaz vašich osobních údajů.</li>
                            <li>Požadovat omezení zpracování.</li>
                            <li>Na přenositelnost vašich údajů.</li>
                            <li>Vznést námitku proti zpracování založenému na oprávněném zájmu.</li>
                            <li>Odvolat souhlas se zpracováním (např. u cookies).</li>
                            <li>Podat stížnost u dozorového úřadu, kterým je Úřad pro ochranu osobních údajů (<a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">www.uoou.cz</a>).</li>
                        </ul>
                        <p>
                            Pro uplatnění svých práv nebo s jakýmkoli dotazem ohledně zpracování osobních údajů nás
                            kontaktujte na adrese{' '}
                            <a href="mailto:info@biketime.cz">info@biketime.cz</a>.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
