// import Link from "next/link";
// import Image from "next/image";

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
                                        <tr><td className="px-4 py-3">150 - 165</td><td className="px-4 py-3">33 - 37</td><td className="px-4 py-3 font-bold">XS</td></tr>
                                        <tr><td className="px-4 py-3">160 - 175</td><td className="px-4 py-3">38 - 43</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">170 - 185</td><td className="px-4 py-3">43 - 47</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">180 - 195</td><td className="px-4 py-3">47 - 52</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">190 - 205</td><td className="px-4 py-3">51 - 56</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">200 - 210</td><td className="px-4 py-3">53 - 60</td><td className="px-4 py-3 font-bold">XXL</td></tr>
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
                                        <tr><td className="px-4 py-3">155 - 175</td><td className="px-4 py-3">43 - 48</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">165 - 185</td><td className="px-4 py-3">48 - 53</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">175 - 195</td><td className="px-4 py-3">53 - 58</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">185 - 205</td><td className="px-4 py-3">58 - 62</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">195 - 215</td><td className="px-4 py-3">62 - 65</td><td className="px-4 py-3 font-bold">XXL</td></tr>
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
                                        <tr><td className="px-4 py-3">160 - 175</td><td className="px-4 py-3">46 - 48</td><td className="px-4 py-3 font-bold">XS</td></tr>
                                        <tr><td className="px-4 py-3">165 - 180</td><td className="px-4 py-3">49 - 51</td><td className="px-4 py-3 font-bold">S</td></tr>
                                        <tr><td className="px-4 py-3">170 - 185</td><td className="px-4 py-3">52 - 54</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">175 - 190</td><td className="px-4 py-3">54 - 56</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">180 - 195</td><td className="px-4 py-3">57 - 59</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">185 - 200</td><td className="px-4 py-3">58 - 61</td><td className="px-4 py-3 font-bold">XXL</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Urban Bikes Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Urban Bikes</h2>
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
                                        <tr><td className="px-4 py-3">150 - 160</td><td className="px-4 py-3">42 - 48</td><td className="px-4 py-3 font-bold">M</td></tr>
                                        <tr><td className="px-4 py-3">160 - 170</td><td className="px-4 py-3">48 - 52</td><td className="px-4 py-3 font-bold">L</td></tr>
                                        <tr><td className="px-4 py-3">170 - 180</td><td className="px-4 py-3">52 - 58</td><td className="px-4 py-3 font-bold">XL</td></tr>
                                        <tr><td className="px-4 py-3">180 - 190</td><td className="px-4 py-3">58 - 63</td><td className="px-4 py-3 font-bold">XXL</td></tr>
                                        <tr><td className="px-4 py-3">nad 190</td><td className="px-4 py-3">nad 63</td><td className="px-4 py-3 font-bold">-</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Youth Bikes Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Youth Bikes (Mládež)</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Výška postavy (cm)</th>
                                            <th className="px-4 py-3 rounded-r-lg">Velikost rámu (cm)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        <tr><td className="px-4 py-3">140 - 150</td><td className="px-4 py-3">33 - 35</td></tr>
                                        <tr><td className="px-4 py-3">150 - 160</td><td className="px-4 py-3">35 - 38</td></tr>
                                        <tr><td className="px-4 py-3">160 - 170</td><td className="px-4 py-3">38 - 41</td></tr>
                                        <tr><td className="px-4 py-3">170 - 180</td><td className="px-4 py-3">41 - 46</td></tr>
                                        <tr><td className="px-4 py-3">180 - 190</td><td className="px-4 py-3">46 - 53</td></tr>
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
