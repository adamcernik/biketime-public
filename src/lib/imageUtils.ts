/**
 * Image Optimization Utilities for ZEG CDN
 * 
 * Converts standard ZEG image URLs to optimized CDN URLs with different sizes
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

interface ImageSizeConfig {
    path: string;
    width: number;
    height: number;
}

const IMAGE_SIZES: Record<Exclude<ImageSize, 'original'>, ImageSizeConfig> = {
    thumbnail: { path: '326x217_png', width: 326, height: 217 },
    small: { path: '460x307_png', width: 460, height: 307 },
    medium: { path: '542x361_png', width: 542, height: 361 },
    large: { path: '1050x700_png', width: 1050, height: 700 },
};

// Brand ID mapping for ZEG CDN
// Note: Currently using BULLS ID for all brands - update if other brands have different IDs
const BRAND_CDN_IDS: Record<string, string> = {
    'BULLS': '1319839',
    'Pegasus': '1319839', // TODO: Verify if Pegasus uses different ID
    'Puky': '1319839',     // TODO: Verify if Puky uses different ID
    // Add more brands as needed
};

const DEFAULT_BRAND_ID = '1319839'; // Fallback to BULLS ID

/**
 * Extracts filename from standard ZEG image URL
 * Converts from: https://assets.zeg.de/{id}/hub_main/{filename}.jpg
 * To: {filename}.png (CDN uses PNG format)
 */
function extractFilename(url: string): string | null {
    if (!url) return null;

    // Pattern: /hub_main/{filename}.{ext}
    const match = url.match(/\/hub_main\/(.+?)\.(jpg|png|jpeg)$/i);
    if (match) {
        // Replace extension with .png since CDN uses PNG
        return match[1] + '.png';
    }

    // If already a CDN URL, extract filename from there
    const cdnMatch = url.match(/\/\d+x\d+_png\/(.+\.png)$/i);
    if (cdnMatch) {
        return cdnMatch[1];
    }

    return null;
}

/**
 * Extracts Brand ID from standard ZEG image URL
 * Pattern: https://assets.zeg.de/{brandId}/hub_main/...
 */
function extractBrandId(url: string): string | null {
    if (!url) return null;

    const match = url.match(/assets\.zeg\.de\/(\d+)\//i);
    if (match) {
        return match[1];
    }

    return null;
}

/**
 * Gets the brand CDN ID for a given brand name or URL
 * First tries to extract from URL, then falls back to brand name mapping
 */
function getBrandCdnId(brandName?: string, originalUrl?: string): string {
    // Try to extract Brand ID directly from the URL first
    if (originalUrl) {
        const extractedId = extractBrandId(originalUrl);
        if (extractedId) {
            return extractedId;
        }
    }

    // Fall back to brand name mapping
    if (!brandName) return DEFAULT_BRAND_ID;
    return BRAND_CDN_IDS[brandName] || DEFAULT_BRAND_ID;
}

/**
 * Generates optimized CDN URL for a given image
 * 
 * @param originalUrl - Original ZEG image URL
 * @param size - Desired image size (thumbnail, small, medium, large, original)
 * @param brandName - Brand name for CDN ID lookup (e.g., 'BULLS', 'Pegasus')
 * @returns Optimized CDN URL or original URL if conversion fails
 * 
 * @example
 * ```ts
 * const thumbUrl = getOptimizedImageUrl(bike.bild1, 'thumbnail', bike.marke);
 * const largeUrl = getOptimizedImageUrl(bike.bild1, 'large', bike.marke);
 * ```
 */
export function getOptimizedImageUrl(
    originalUrl: string | undefined | null,
    size: ImageSize = 'medium',
    brandName?: string
): string {
    // Return placeholder if no URL provided
    if (!originalUrl) {
        return '/placeholder-bike.jpg';
    }

    // If 'original' size requested, return the original URL
    if (size === 'original') {
        return originalUrl;
    }

    // Extract filename from URL
    const filename = extractFilename(originalUrl);
    if (!filename) {
        // Couldn't parse URL, return original
        console.warn('Could not extract filename from URL:', originalUrl);
        return originalUrl;
    }

    // Get brand CDN ID (extracts from URL if available, falls back to brand name)
    const brandId = getBrandCdnId(brandName, originalUrl);

    // Get size configuration
    const sizeConfig = IMAGE_SIZES[size];

    // Generate CDN URL
    const cdnUrl = `https://cdn-assets.zeg.de/brands/${brandId}/${sizeConfig.path}/${filename}`;

    return cdnUrl;
}

/**
 * Gets the dimensions for a given image size
 * Useful for Next.js Image component width/height props
 */
export function getImageDimensions(size: ImageSize): { width: number; height: number } | null {
    if (size === 'original') return null;
    const config = IMAGE_SIZES[size];
    return { width: config.width, height: config.height };
}

/**
 * Checks if a URL is already a CDN URL
 */
export function isCdnUrl(url: string): boolean {
    return url.includes('cdn-assets.zeg.de');
}

/**
 * Preloads an optimized image
 * Useful for critical images that should load immediately
 */
export function preloadImage(url: string, size: ImageSize = 'medium', brandName?: string): void {
    if (typeof window === 'undefined') return;

    const optimizedUrl = getOptimizedImageUrl(url, size, brandName);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    document.head.appendChild(link);
}
