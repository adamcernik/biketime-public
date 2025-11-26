'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike } from '@/components/catalog/BikeCard';

export default function AbsArticlePage() {
    return (
        <main className="min-h-screen bg-white">
            <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900">
                    <Image
                        src="https://firebasestorage.googleapis.com/v0/b/btb2b-90b2f.firebasestorage.app/o/articles%2Fabs1.jpg?alt=media&token=948570a7-8577-420b-be99-beec0ca519a2"
                        alt="Bosch ABS / TRP Brakes Action Shot"
                        fill
                        className="object-cover opacity-80"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="container-custom relative z-10 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                        Brzdy TRP AMS na elektrokolech BULLS
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-200 max-w-3xl mx-auto drop-shadow-md">
                        Síla a kontrola pro moderní e-MTB
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 md:py-24">
                <div className="container-custom max-w-4xl">
                    <div className="prose prose-lg prose-zinc mx-auto">
                        <p className="lead text-xl text-zinc-600 mb-12">
                            TRP (Tektro Racing Products) se stala klíčovým hráčem na trhu s komponenty pro elektrokola a její brzdy jsou často k vidění na vysoce výkonných elektrických horských kolech značky <strong>BULLS</strong>. Zatímco přesné modelové označení „AMS“ (pravděpodobně zkratka pro All-Mountain System) není tak běžné jako jiné modely TRP, velmi pravděpodobně se jedná o označení pro jejich specializovaný brzdový systém, často model <strong>TRP Trail EVO</strong> a jeho integraci se systémem <strong>Bosch eBike ABS</strong> na některých eMTB od BULLS.
                        </p>

                        <h2 className="text-3xl font-bold mt-16 mb-8">Optimalizovaný Brzdný Výkon pro E-MTB</h2>
                        <p>
                            Elektrokola, zejména celoodpružená elektrická horská kola (e-MTB), vyžadují podstatně větší brzdný výkon než tradiční kola kvůli své <strong>vyšší hmotnosti</strong> a <strong>vyšším průměrným rychlostem</strong>, které dokážou udržet. TRP řeší tuto potřebu svými moderními brzdovými systémy (např. Trail EVO nebo Slate Evo, které se objevují na modelech BULLS Sonic EVO):
                        </p>

                        <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-zinc-100 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-4">Čtyřpístkové Třmeny</h3>
                                <p className="text-zinc-600">
                                    Nejnovější systémy TRP (jako je Trail EVO, často viděný na modelech BULLS řady Sonic EVO AM) využívají čtyřpístkové třmeny. Tato konstrukce poskytuje <strong>vynikající pákový efekt a brzdnou sílu</strong> ve srovnání s dvoupístkovými systémy, což je zásadní pro kontrolu těžkého e-kola na strmých sjezdech.
                                </p>
                            </div>
                            <div className="bg-zinc-100 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-4">Silnější Kotouče</h3>
                                <p className="text-zinc-600">
                                    TRP často používá kotouče o <strong>tloušťce 2,3 mm</strong> (místo standardních 1,8 mm nebo 2,0 mm). Tento přidaný materiál výrazně zlepšuje <strong>odvod tepla</strong>, čímž zabraňuje vadnutí brzd (fading) na dlouhých a náročných sjezdech.
                                </p>
                            </div>
                        </div>

                        <div className="my-12 relative aspect-video bg-zinc-100 rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src="https://firebasestorage.googleapis.com/v0/b/btb2b-90b2f.firebasestorage.app/o/articles%2Fabs2.jpg?alt=media&token=189e9f9c-7038-4e56-946f-d65297370335"
                                alt="Detail of TRP Caliper / Rotor"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <p>
                            <strong>Design Zaměřený na E-Biky:</strong> Geometrie a vnitřní mechanismus brzdové páky a hlavního válce jsou často přepracovány tak, aby poskytovaly <strong>vynikající modulaci</strong> (schopnost jemně kontrolovat brzdnou sílu) bez obětování hrubé brzdné síly potřebné pro nouzové brzdění.
                        </p>

                        <h2 className="text-3xl font-bold mt-16 mb-8">Integrace se Systémem Bosch ABS</h2>
                        <p>
                            Na špičkových modelech BULLS vybavených systémem Bosch Smart System jsou brzdy TRP často integrovány se <strong>Systémem ABS (Anti-lock Braking System) pro elektrokola od Bosch</strong>. Právě zde by označení jako „AMS“ mohlo mít největší význam, protože by poukazovalo na kompletní, vysoce výkonné brzdné řešení:
                        </p>

                        <div className="my-12 relative aspect-video bg-zinc-100 rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src="https://firebasestorage.googleapis.com/v0/b/btb2b-90b2f.firebasestorage.app/o/articles%2Fabs3.jpg?alt=media&token=85573489-0268-450f-901e-c04519965823"
                                alt="Bosch ABS System Diagram"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                                <div>
                                    <strong>Prevence Zablokování Předního Kola:</strong> Systém ABS využívá snímače rychlosti kol k detekci hrozícího zablokování předního kola při silném brzdění. Poté rychle moduluje tlak v třmenu TRP, aby se kolo stále odvalovalo, což <strong>zabraňuje pádu</strong> a zachovává kontrolu nad řízením.
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                                <div>
                                    <strong>Zmírnění Zvedání Zadního Kola:</strong> Systém může také aktivně řídit brzdnou sílu, aby zabránil zvedání zadního kola ze země během prudkého zastavení, což dále <strong>zvyšuje bezpečnost a kontrolu</strong>.
                                </div>
                            </li>
                        </ul>

                        <div className="mt-16 p-8 bg-zinc-50 border border-zinc-200 rounded-2xl">
                            <p className="font-medium text-lg mb-0">
                                Stručně řečeno, když na elektrokole BULLS uvidíte špičkové brzdy TRP, díváte se na systém navržený pro maximální kontrolu, vynikající řízení tepla a surový výkon nezbytný pro bezpečné zvládání jedinečných nároků moderní jízdy na e-mountain biku.
                            </p>
                        </div>

                        <div className="mt-12 text-center">
                            <Link
                                href="/catalog?category=Celopéra&ebike=true"
                                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                            >
                                Prohlédnout e-biky s ABS
                            </Link>
                        </div>

                        {/* Featured ABS Bikes */}
                        <div className="mt-24 not-prose">
                            <h2 className="text-3xl font-bold text-zinc-900 mb-8 text-center">Modely s Bosch ABS</h2>
                            <FeaturedBikesList bikeIds={['5259002808', '5248016407', '5259003608']} />
                        </div>
                    </div>
                </div>
            </section>
        </main >
    );
}

// Mini component to fetch and display specific bikes
function FeaturedBikesList({ bikeIds }: { bikeIds: string[] }) {
    const [bikes, setBikes] = React.useState<Bike[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const load = async () => {
            try {
                // Fetch all bikes and filter (not optimal but simple for now without a specific ID endpoint)
                // Or better: use the catalog API with specific IDs if supported, or just fetch all and find.
                // Since we don't have a multi-ID endpoint, we'll fetch them one by one or filter from a larger set.
                // Let's try fetching by ID if the API supports it, otherwise we might need to fetch a larger list.
                // Actually, the catalog API supports filtering. Let's try to fetch them individually.

                const promises = bikeIds.map(id =>
                    fetch(`/api/catalog/${id}`).then(r => r.ok ? r.json() : null)
                );

                const results = await Promise.all(promises);
                const foundBikes = results.filter(b => b !== null);
                setBikes(foundBikes);
            } catch (e) {
                console.error('Error loading ABS bikes', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [bikeIds]);

    if (loading) return <div className="text-center py-8">Načítám kola...</div>;

    if (bikes.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bikes.map(bike => (
                <Link key={bike.id} href={`/catalog/${bike.id}`} className="group block bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 hover:shadow-lg transition-all">
                    <div className="aspect-[4/3] relative bg-white p-4">
                        <Image
                            src={bike.bild1 || '/placeholder-bike.png'}
                            alt={bike.modell || 'Bike'}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div className="p-6">
                        <h3 className="font-bold text-lg text-zinc-900 mb-2 group-hover:text-primary transition-colors">{bike.modell}</h3>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-500">{bike.marke}</span>
                            {bike.mocCzk && (
                                <span className="font-bold text-zinc-900">
                                    {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(bike.mocCzk)}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
