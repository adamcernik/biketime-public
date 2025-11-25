import { Bike, BikeCard } from './BikeCard';

interface ProductGridProps {
    bikes: Bike[];
    loading: boolean;
    viewMode: 'grid' | 'list';
    page: number;
    totalPages: number;
    setPage: (p: number) => void;
}

export function ProductGrid({ bikes, loading, viewMode, page, totalPages, setPage }: ProductGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse border border-zinc-100" />
                ))}
            </div>
        );
    }

    if (bikes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-zinc-900">Nebyly nalezeny žádné produkty</h3>
                <p className="text-zinc-500 mt-1">Zkuste upravit filtry nebo hledání.</p>
            </div>
        );
    }

    return (
        <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {bikes.map((b) => <BikeCard key={b.id} bike={b} viewMode={viewMode} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Předchozí
                    </button>
                    <span className="text-sm font-medium text-zinc-600">
                        Strana {page} z {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Další
                    </button>
                </div>
            )}
        </>
    );
}
