'use client';

import { useState } from 'react';

export default function TestCDNPage() {
    // Example product from your data
    const [testUrl, setTestUrl] = useState('https://assets.zeg.de/1678540/hub_main/ZEG_525900250841.jpg');
    const [brandId, setBrandId] = useState('1319839');
    const [filename, setFilename] = useState('ZEG_524901200440.png');

    // Size variants available from ZEG CDN
    const sizes = [
        { name: 'Thumbnail', path: '326x217_png', width: 326, height: 217 },
        { name: 'Small', path: '460x307_png', width: 460, height: 307 },
        { name: 'Medium', path: '542x361_png', width: 542, height: 361 },
        { name: 'Large', path: '1050x700_png', width: 1050, height: 700 },
    ];

    // Extract filename from current URL pattern
    const extractFilename = (url: string): string | null => {
        // Pattern: https://assets.zeg.de/{id}/hub_main/{filename}
        const match = url.match(/\/hub_main\/(.+?\.(jpg|png|jpeg))$/i);
        if (match) {
            // Replace .jpg with .png since CDN uses PNG
            return match[1].replace(/\.(jpg|jpeg)$/i, '.png');
        }
        return null;
    };

    // Extract Brand ID from URL
    const extractBrandId = (url: string): string | null => {
        // Pattern: https://assets.zeg.de/{brandId}/hub_main/...
        const match = url.match(/assets\.zeg\.de\/(\d+)\//i);
        if (match) {
            return match[1];
        }
        return null;
    };

    // Generate CDN URL for specific size
    const generateCdnUrl = (brandId: string, filename: string, sizePath: string): string => {
        return `https://cdn-assets.zeg.de/brands/${brandId}/${sizePath}/${filename}`;
    };

    const handleTestUrl = () => {
        const extracted = extractFilename(testUrl);
        const extractedBrandId = extractBrandId(testUrl);

        if (extracted) {
            setFilename(extracted);
        } else {
            alert('Could not extract filename from URL');
            return;
        }

        if (extractedBrandId) {
            setBrandId(extractedBrandId);
        } else {
            alert('Could not extract Brand ID from URL - using default');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">ZEG CDN Image Test</h1>

                {/* Input Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Product URL (from your database)
                            </label>
                            <input
                                type="text"
                                value={testUrl}
                                onChange={(e) => setTestUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="https://assets.zeg.de/1678540/hub_main/ZEG_525900250841.jpg"
                            />
                            <button
                                onClick={handleTestUrl}
                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Extract Filename
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brand ID (from CDN structure)
                            </label>
                            <input
                                type="text"
                                value={brandId}
                                onChange={(e) => setBrandId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="1319839"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This might be constant for all BULLS products, or vary by brand
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filename
                            </label>
                            <input
                                type="text"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="ZEG_524901200440.png"
                            />
                        </div>
                    </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sizes.map((size) => {
                        const url = generateCdnUrl(brandId, filename, size.path);

                        return (
                            <div key={size.name} className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-2">{size.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {size.width} × {size.height}px
                                </p>

                                {/* Direct img tag for testing */}
                                <div className="mb-4 bg-gray-100 p-4 rounded">
                                    <img
                                        src={url}
                                        alt={`${size.name} test`}
                                        className="w-full h-auto"
                                        onLoad={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            console.log(`✅ ${size.name} loaded:`, img.naturalWidth, 'x', img.naturalHeight);
                                        }}
                                        onError={(e) => {
                                            console.error(`❌ ${size.name} failed to load`);
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                        }}
                                    />
                                </div>

                                {/* URL Display */}
                                <div className="text-xs bg-gray-50 p-3 rounded break-all">
                                    <strong>URL:</strong>
                                    <br />
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {url}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Original URL Test */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Original URL (for comparison)</h3>
                    <div className="bg-gray-100 p-4 rounded mb-4">
                        <img
                            src={testUrl}
                            alt="Original"
                            className="w-full max-w-2xl h-auto mx-auto"
                            onLoad={() => console.log('✅ Original URL loaded')}
                            onError={() => console.error('❌ Original URL failed')}
                        />
                    </div>
                    <div className="text-xs bg-gray-50 p-3 rounded break-all">
                        <strong>Original URL:</strong>
                        <br />
                        <a
                            href={testUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {testUrl}
                        </a>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Paste a product image URL from your database</li>
                        <li>Click &quot;Extract Filename&quot; to parse it</li>
                        <li>Try different Brand IDs (1319839, or try extracting from your current URLs)</li>
                        <li>Check browser console to see which images load successfully</li>
                        <li>Open failed URLs in new tab to see error messages</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
