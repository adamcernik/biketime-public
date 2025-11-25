import Link from "next/link";
import Image from "next/image";

export default function SizeGuidePage() {
    return (
        <main className="min-h-screen bg-zinc-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200">
                <div className="container-custom py-8">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Tabulka velikostí BULLS</h1>
                    <p className="text-zinc-500">Najděte tu správnou velikost rámu pro vaši postavu.</p>
                </div>
            </div>

            <div className="container-custom py-12">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Text Content / Tables */}
                    <div className="space-y-12">

                        {/* MTB Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Horská kola (MTB)</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Výška postavy (cm)</th>
                                            <th className="px-4 py-3">Velikost rámu (cm)</th>
                                            <th className="px-4 py-3 rounded-r-lg">Velikost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        <tr><td className="px-4 py-3">150 - 160</td><td className="px-4 py-3">37 - 40</td><td className="px-4 py-3 font-bold">XS</td></tr>
                                        <tr><td className="px-4 py-3">160 - 170</td><td className="px-4 py-3">41 - 44</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">170 - 180</td><td className="px-4 py-3">45 - 48</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">180 - 190</td><td className="px-4 py-3">49 - 52</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">190 - 200</td><td className="px-4 py-3">53 - 56</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">nad 200</td><td className="px-4 py-3">57 - 62</td><td className="px-4 py-3 font-bold">XXL</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Gravel / Road Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Gravel & Silniční kola</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Výška postavy (cm)</th>
                                            <th className="px-4 py-3">Velikost rámu (cm)</th>
                                            <th className="px-4 py-3 rounded-r-lg">Velikost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        <tr><td className="px-4 py-3">160 - 170</td><td className="px-4 py-3">47 - 50</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">170 - 180</td><td className="px-4 py-3">51 - 54</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">180 - 190</td><td className="px-4 py-3">55 - 58</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">190 - 200</td><td className="px-4 py-3">59 - 61</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">nad 200</td><td className="px-4 py-3">62+</td><td className="px-4 py-3 font-bold">XXL</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Trekking / City Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Trekking & Městská kola</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Výška postavy (cm)</th>
                                            <th className="px-4 py-3">Velikost rámu (cm)</th>
                                            <th className="px-4 py-3 rounded-r-lg">Velikost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        <tr><td className="px-4 py-3">155 - 165</td><td className="px-4 py-3">41 - 45</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">165 - 175</td><td className="px-4 py-3">46 - 50</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">175 - 185</td><td className="px-4 py-3">51 - 55</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">185 - 195</td><td className="px-4 py-3">56 - 60</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">nad 195</td><td className="px-4 py-3">61+</td><td className="px-4 py-3 font-bold">XXL</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                    </div>

                </div>
            </div>
        </main>
    );
}
