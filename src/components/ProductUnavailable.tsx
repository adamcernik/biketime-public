import Link from 'next/link';
import SimpleBikeCard, { SimpleBikeCardProps } from './SimpleBikeCard';

interface ProductUnavailableProps {
    modelLabel: string;
    searchTerm: string;
    successor: SimpleBikeCardProps | null;
    similar: SimpleBikeCardProps[];
}

// Soft-404 page: shown instead of a hard 404 when a shared /catalog/<slug> link
// points to a bike that is no longer in the catalog. Inherits the global header/
// footer from the root layout. The route marks this noindex (follow) via metadata.
export default function ProductUnavailable({ modelLabel, searchTerm, successor, similar }: ProductUnavailableProps) {
    const searchHref = searchTerm ? `/catalog?search=${encodeURIComponent(searchTerm)}` : '/catalog';

    return (
        <main className="min-h-screen bg-zinc-50">
            <div className="container-custom section-padding">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                    {modelLabel ? `${modelLabel} už není v nabídce` : 'Toto kolo už není v nabídce'}
                </h1>
                <p className="mt-3 max-w-2xl text-zinc-500">
                    Model, na který odkaz míří, jsme aktuálně vyprodali nebo byl nahrazen novějším.
                    {successor
                        ? ' Níže najdete aktuální variantu téhož modelu.'
                        : ' Mrkněte na podobná kola níže.'}
                </p>

                {successor && (
                    <div className="mt-8">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                            Aktuálně nabízíme
                        </p>
                        <div className="max-w-xs">
                            <SimpleBikeCard bike={successor} />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href={searchHref}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-red-700 transition-colors"
                    >
                        Hledat v katalogu
                    </Link>
                    <Link
                        href="/catalog"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-zinc-900 font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                        Zobrazit vše
                    </Link>
                </div>

                {similar.length > 0 && (
                    <section className="mt-14">
                        <h2 className="mb-6 text-2xl font-bold text-zinc-900">Podobná kola</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similar.map((item) => (
                                <SimpleBikeCard key={item.id} bike={item} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
