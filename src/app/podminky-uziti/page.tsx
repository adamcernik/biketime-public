import React from 'react';

const proseStyles = [
    'prose prose-zinc max-w-none',
    'prose-p:leading-relaxed',
    'prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-4',
    'prose-ul:my-5 prose-li:my-2 prose-li:leading-relaxed marker:prose-li:text-zinc-400',
    'prose-strong:text-zinc-900',
    'prose-a:text-red-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline',
].join(' ');

export default function TermsOfUsePage() {
    return (
        <main className="min-h-screen bg-zinc-50 py-12 md:py-20">
            <div className="container-custom max-w-3xl">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100">
                    <header className="mb-10 pb-8 border-b border-zinc-100">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 mb-3">
                            Právní informace
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
                            Podmínky užití webu
                        </h1>
                        <p className="mt-4 text-sm text-zinc-500">Platné od 25. 11. 2025</p>
                    </header>

                    <div className={proseStyles}>
                        <p className="lead">
                            Vítejte na webových stránkách Biketime.cz. Používáním tohoto webu souhlasíte s níže uvedenými podmínkami.
                        </p>

                        <h2>1. Úvodní ustanovení</h2>
                        <p>
                            Provozovatelem tohoto webu je společnost <strong>Biketime s.r.o.</strong> (dále jen &quot;Provozovatel&quot;).
                            Web slouží jako online katalog jízdních kol značky BULLS a souvisejícího příslušenství.
                        </p>

                        <h2>2. Charakter služeb</h2>
                        <p>
                            <strong>Tento web není internetovým obchodem (e-shopem).</strong> Veškeré informace zde uvedené mají pouze informativní charakter.
                            Provozovatel na tomto webu přímo neprodává žádné zboží ani neuzavírá kupní smlouvy se spotřebiteli.
                        </p>
                        <p>
                            Web slouží k:
                        </p>
                        <ul>
                            <li>Prezentaci produktů značky BULLS.</li>
                            <li>Zobrazení informativní dostupnosti a cen.</li>
                            <li>Přesměrování zájemců na autorizované prodejce (partnery), u kterých lze zboží zakoupit.</li>
                        </ul>

                        <h2>3. Dostupnost a ceny</h2>
                        <p>
                            Ačkoliv se snažíme udržovat informace o dostupnosti a cenách co nejaktuálnější, <strong>nemůžeme garantovat jejich 100% přesnost v reálném čase</strong>.
                        </p>
                        <ul>
                            <li>Ceny uvedené na webu jsou doporučené maloobchodní ceny. Konečná cena u prodejce se může lišit.</li>
                            <li>Informace o skladové dostupnosti (&quot;Skladem&quot;, &quot;Na cestě&quot;) vychází z dat poskytnutých našimi partnery, ale může dojít k prodlevě při aktualizaci.</li>
                            <li>Pro ověření aktuální ceny a dostupnosti vždy doporučujeme kontaktovat přímo konkrétní prodejnu.</li>
                        </ul>

                        <h2>4. Odpovědnost</h2>
                        <p>
                            Provozovatel nenese odpovědnost za:
                        </p>
                        <ul>
                            <li>Případné nepřesnosti v popisu produktů nebo technických specifikacích.</li>
                            <li>Rozdíly mezi informacemi uvedenými na tomto webu a skutečným stavem u prodejce.</li>
                            <li>Obsah webových stránek třetích stran, na které tento web odkazuje.</li>
                        </ul>

                        <h2>5. Autorská práva</h2>
                        <p>
                            Veškerý obsah tohoto webu (texty, fotografie, loga, design) je chráněn autorským právem.
                            Jeho kopírování, šíření nebo jiné užití bez předchozího písemného souhlasu Provozovatele je zakázáno.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
