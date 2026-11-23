/**
 * Ruční pauza TOP AKCE (od 23.11.2026): nabídka je schovaná z menu, stránka
 * /top-akce ukazuje jen zprávu a API nevrací položky ani nepřijímá
 * objednávky. Důvod: čekáme na aktuální skladové zásoby výrobce.
 *
 * Zpět zapnout = nastavit `TOP_AKCE_PAUSED = false` a nasadit. Nezávislé na
 * přepínači „zveřejněno“ v adminu (settings/topAkce.published), který dál
 * platí, když pauza není.
 */
export const TOP_AKCE_PAUSED = true;

export const TOP_AKCE_PAUSE_TITLE = 'TOP AKCE je dočasně pozastavena';
export const TOP_AKCE_PAUSE_MESSAGE =
    'Čekáme na aktuální skladové zásoby výrobce. Nabídku znovu otevřeme, jakmile budeme mít potvrzené kusy. ' +
    'Už přijaté objednávky vyřizujeme a potvrzujeme jednotlivě e-mailem.';
