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
                            <p>Křižíkova 53, 186 00 Praha 8, Karlín</p>
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
                            <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, operační systém, datum a čas návštěvy (prostřednictvím logů serveru a analytických nástrojů).</li>
                            <li><strong>Údaje o poloze:</strong> Pokud využijete funkci &quot;Najít nejbližší obchod&quot;, zpracováváme vaši aktuální polohu pouze pro účel vyhledání prodejen. Tato data neukládáme.</li>
                            <li><strong>Kontaktní údaje:</strong> Pokud nás kontaktujete e-mailem nebo telefonicky, zpracováváme vaše kontaktní údaje za účelem vyřízení vašeho dotazu.</li>
                        </ul>

                        <h2>3. Účel zpracování</h2>
                        <p>Vaše údaje zpracováváme za účelem:</p>
                        <ul>
                            <li>Zajištění technického chodu a bezpečnosti webových stránek.</li>
                            <li>Analýzy návštěvnosti a zlepšování našich služeb (pokud udělíte souhlas s cookies).</li>
                            <li>Zobrazení nejbližších prodejen na mapě.</li>
                            <li>Komunikace se zákazníky.</li>
                        </ul>

                        <h2>4. Soubory Cookie</h2>
                        <p>
                            Náš web používá soubory cookie. Cookie jsou malé textové soubory, které se ukládají do vašeho zařízení.
                        </p>
                        <ul>
                            <li><strong>Nezbytné cookies:</strong> Jsou nutné pro fungování webu (např. uložení vašeho souhlasu s cookies).</li>
                            <li><strong>Analytické cookies:</strong> Pomáhají nám měřit návštěvnost a analyzovat chování uživatelů na webu. Využíváme službu PostHog, která nám umožňuje analyzovat průchod webem a nahrávat relace (session recording) za účelem odhalování chyb a zlepšování použitelnosti. Veškerá data jsou zpracovávána anonymizovaně. Tyto nástroje používáme pouze s vaším souhlasem.</li>
                        </ul>
                        <p>
                            Nastavení cookies můžete kdykoli změnit ve svém prohlížeči nebo prostřednictvím naší cookie lišty.
                        </p>

                        <h2>5. Vaše práva</h2>
                        <p>V souvislosti se zpracováním osobních údajů máte právo:</p>
                        <ul>
                            <li>Požadovat přístup k vašim osobním údajům.</li>
                            <li>Požadovat opravu nebo výmaz vašich osobních údajů.</li>
                            <li>Vznést námitku proti zpracování.</li>
                            <li>Odvolat souhlas se zpracováním (např. u cookies).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
