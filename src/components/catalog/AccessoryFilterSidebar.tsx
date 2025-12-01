
interface AccessoryFilterSidebarProps {
    categories: string[];
    brands: string[];

    // Current Filters
    selectedCategory: string;
    selectedBrand: string;

    // Setters
    setCategory: (v: string) => void;
    setBrand: (v: string) => void;

    total: number;
}

export function AccessoryFilterSidebar({
    categories,
    brands,
    selectedCategory,
    selectedBrand,
    setCategory,
    setBrand,
}: AccessoryFilterSidebarProps) {
    return (
        <div className="space-y-8">

            {/* Categories */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Kategorie</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(cat => (
                        <div
                            key={cat}
                            onClick={() => setCategory(selectedCategory === cat ? '' : cat)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300 group-hover:border-zinc-400'}`}>
                                {selectedCategory === cat && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm capitalize ${selectedCategory === cat ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>{cat}</span>
                        </div>
                    ))}
                </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Brands */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Značka</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {brands.map(brand => (
                        <div
                            key={brand}
                            onClick={() => setBrand(selectedBrand === brand ? '' : brand)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrand === brand ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300 group-hover:border-zinc-400'}`}>
                                {selectedBrand === brand && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm ${selectedBrand === brand ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>{brand}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
