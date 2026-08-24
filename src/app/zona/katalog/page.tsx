'use client';

import { useAuth } from '@/components/AuthProvider';

export default function CatalogSettingsPage() {
    const { shopUser, hideB2BPrices, toggleHideB2BPrices } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Nastavení katalogu</h1>
            <p className="text-sm text-zinc-500 mb-6">Jak se vám má katalog zobrazovat.</p>

            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="font-semibold text-zinc-900">Zobrazovat velkoobchodní ceny (VOC)</h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            V katalogu a na detailu kola se vedle MOC zobrazuje i vaše nákupní cena
                            {shopUser?.priceLevel ? ` (hladina ${shopUser.priceLevel})` : ''}.
                            Vypněte, když ukazujete katalog zákazníkovi na prodejně — VOC pak zůstane skrytá,
                            dokud ji znovu nezapnete. Nastavení se pamatuje v tomto prohlížeči.
                        </p>
                    </div>
                    <button
                        role="switch"
                        aria-checked={!hideB2BPrices}
                        onClick={toggleHideB2BPrices}
                        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${!hideB2BPrices ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${!hideB2BPrices ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
                <div className={`mt-4 text-xs font-medium px-3 py-2 rounded-lg inline-block ${!hideB2BPrices ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {!hideB2BPrices ? 'VOC se zobrazují' : 'VOC jsou skryté'}
                </div>
                <p className="text-xs text-zinc-400 mt-4">
                    Ceník v klientské zóně zobrazuje VOC vždy — toto nastavení se týká jen veřejného katalogu.
                </p>
            </div>
        </div>
    );
}
