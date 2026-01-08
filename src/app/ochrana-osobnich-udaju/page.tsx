import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-zinc-50 py-12 md:py-20">
            <div className="container-custom max-w-4xl">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-8">Zásady ochrany osobních údajů</h1>

                    <div className="prose prose-zinc max-w-none">
                        <p className="lead">
                            Vážení zákazníci, velmi si vážíme vaší důvěry a ochrana vašich osobních údajů je pro nás prioritou.
                            Níže naleznete informace o tom, jaké údaje shromažďujeme a jak s nimi nakládáme v souladu s nařízením GDPR.
                        </p>

                        <h3>1. Správce osobních údajů</h3>
                        <p>
                            Správcem vašich osobních údajů je společnost:<br />
                            <strong>Biketime s.r.o.</strong><br />
                            Se sídlem: K dolům 1924/42, 143 00 Praha 4<br />
                            IČO: 03269787<br />
                            E-mail: <a href="mailto:info@biketime.cz">info@biketime.cz</a>
                        </p>

                        <h3>2. Jaké údaje shromažďujeme</h3>
                        <p>
                            Při používání našeho webu můžeme shromažďovat následující údaje:
                        </p>
                        <ul>
                            <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, operační systém, datum a čas návštěvy (prostřednictvím logů serveru a analytických nástrojů).</li>
                            <li><strong>Údaje o poloze:</strong> Pokud využijete funkci &quot;Najít nejbližší obchod&quot;, zpracováváme vaši aktuální polohu pouze pro účel vyhledání prodejen. Tato data neukládáme.</li>
                            <li><strong>Kontaktní údaje:</strong> Pokud nás kontaktujete e-mailem nebo telefonicky, zpracováváme vaše kontaktní údaje za účelem vyřízení vašeho dotazu.</li>
                        </ul>

                        <h3>3. Účel zpracování</h3>
                        <p>Vaše údaje zpracováváme za účelem:</p>
                        <ul>
                            <li>Zajištění technického chodu a bezpečnosti webových stránek.</li>
                            <li>Analýzy návštěvnosti a zlepšování našich služeb (pokud udělíte souhlas s cookies).</li>
                            <li>Zobrazení nejbližších prodejen na mapě.</li>
                            <li>Komunikace se zákazníky.</li>
                        </ul>

                        <h3>4. Soubory Cookie</h3>
                        <p>
                            Náš web používá soubory cookie. Cookie jsou malé textové soubory, které se ukládají do vašeho zařízení.
                        </p>
                        <ul>
                            <li><strong>Nezbytné cookies:</strong> Jsou nutné pro fungování webu (např. uložení vašeho souhlasu s cookies).</li>
                            <li><strong>Analytické cookies:</strong> Pomáhají nám měřit návštěvnost a analyzovat chování uživatelů na webu. Využíváme služby Google Analytics a PostHog. PostHog nám navíc umožňuje analyzovat průchod webem a nahrávat relace (session recording) za účelem odhalování chyb a zlepšování použitelnosti. Veškerá data jsou zpracovávána anonymizovaně. Tyto nástroje používáme pouze s vaším souhlasem.</li>
                        </ul>
                        <p>
                            Nastavení cookies můžete kdykoli změnit ve svém prohlížeči nebo prostřednictvím naší cookie lišty.
                        </p>

                        <h3>5. Vaše práva</h3>
                        <p>V souvislosti se zpracováním osobních údajů máte právo:</p>
                        <ul>
                            <li>Požadovat přístup k vašim osobním údajům.</li>
                            <li>Požadovat opravu nebo výmaz vašich osobních údajů.</li>
                            <li>Vznést námitku proti zpracování.</li>
                            <li>Odvolat souhlas se zpracováním (např. u cookies).</li>
                        </ul>

                        <p className="mt-8 text-sm text-zinc-500">
                            Tyto zásady jsou platné od 25. 11. 2025.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
