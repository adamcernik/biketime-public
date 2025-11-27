import { getSizeLabel } from '@/lib/size-mapping';

interface FilterSidebarV2Props {
    categories: string[];
    brands: string[];
    years: number[];

    // Current Filters
    selectedCategory: string;
    selectedBrand: string;
    selectedYear: string;

    // Setters
    setCategory: (v: string) => void;
    setBrand: (v: string) => void;
    setYear: (v: string) => void;

    total: number;
}

export function FilterSidebarV2({
    categories,
    brands,
    years,
    selectedCategory,
    selectedBrand,
    selectedYear,
    setCategory,
    setBrand,
    setYear,
}: FilterSidebarV2Props) {
    return (
        <div className="space-y-8">

            {/* Brands */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Značka</h3>
                <div className="space-y-2">
                    {brands.map(brand => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrand === brand ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300 group-hover:border-zinc-400'}`}>
                                {selectedBrand === brand && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                                type="radio"
                                name="brand"
                                className="hidden"
                                checked={selectedBrand === brand}
                                onChange={() => setBrand(selectedBrand === brand ? '' : brand)}
                            />
                            <span className={`text-sm ${selectedBrand === brand ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>{brand}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Categories */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Kategorie</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300 group-hover:border-zinc-400'}`}>
                                {selectedCategory === cat && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                                type="radio"
                                name="category"
                                className="hidden"
                                checked={selectedCategory === cat}
                                onChange={() => setCategory(selectedCategory === cat ? '' : cat)}
                            />
                            <span className={`text-sm ${selectedCategory === cat ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Year */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Rok</h3>
                <div className="flex flex-wrap gap-2">
                    {years.map(y => (
                        <button
                            key={y}
                            onClick={() => setYear(selectedYear === String(y) ? '' : String(y))}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${selectedYear === String(y) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
