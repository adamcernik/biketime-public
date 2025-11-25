import { getSizeLabel } from '@/lib/size-mapping';

interface FilterSidebarProps {
    categories: string[];
    sizeOptions: string[];
    moseOptions: string[];
    yearOptions: string[];

    // Current Filters
    selectedCategory: string;
    selectedSize: string;
    selectedMose: string;
    selectedYear: string;
    ebikeOnly: 'all' | 'ebike' | 'non';
    inStockOnly: boolean;

    // Setters
    setCategory: (v: string) => void;
    setSize: (v: string) => void;
    setMose: (v: string) => void;
    setYear: (v: string) => void;
    setEbikeOnly: (v: 'all' | 'ebike' | 'non') => void;
    setInStockOnly: (v: boolean) => void;

    total: number;
}

export function FilterSidebar({
    categories,
    sizeOptions,
    moseOptions,
    yearOptions,
    selectedCategory,
    selectedSize,
    selectedMose,
    selectedYear,
    ebikeOnly,
    inStockOnly,
    setCategory,
    setSize,
    setMose,
    setYear,
    setEbikeOnly,
    setInStockOnly,
    // total // unused
}: FilterSidebarProps) {
    return (
        <div className="space-y-8">

            {/* Type Toggle (E-Bike vs Regular) */}
            <div className="bg-zinc-100 p-1 rounded-xl flex">
                <button
                    onClick={() => setEbikeOnly('ebike')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${ebikeOnly === 'ebike' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                    E-Bike
                </button>
                <button
                    onClick={() => setEbikeOnly('non')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${ebikeOnly === 'non' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                    Kolo
                </button>
                <button
                    onClick={() => setEbikeOnly('all')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${ebikeOnly === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                    Vše
                </button>
            </div>

            {/* Availability */}
            <div>
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-zinc-900">Pouze skladem</span>
                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${inStockOnly ? 'bg-primary' : 'bg-zinc-200'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                </label>
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

            {/* Size Grid */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Velikost rámu</h3>
                <div className="grid grid-cols-3 gap-2">
                    {sizeOptions.map(s => {
                        const cm = parseInt(s, 10);
                        // We assume 'default' category for general filter, or we could try to be smarter if category is selected.
                        // For simplicity, let's just show the label if we can infer it, or just the number.
                        const label = getSizeLabel(cm, 'default');

                        return (
                            <button
                                key={s}
                                onClick={() => setSize(selectedSize === s ? '' : s)}
                                className={`px-2 py-2 text-xs font-medium rounded border transition-all ${selectedSize === s ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                            >
                                {label ? `${label} (${s})` : s}
                            </button>
                        );
                    })}
                </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Model Series */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Modelová řada</h3>
                <select
                    value={selectedMose}
                    onChange={(e) => setMose(e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
                >
                    <option value="">Všechny modely</option>
                    {moseOptions.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {/* Year */}
            <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Rok</h3>
                <div className="flex flex-wrap gap-2">
                    {yearOptions.map(y => (
                        <button
                            key={y}
                            onClick={() => setYear(selectedYear === y ? '' : y)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${selectedYear === y ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
