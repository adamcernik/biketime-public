/**
 * SEO Metadata Generator for Product Pages
 * Generates optimized titles and descriptions for e-bikes and regular bikes
 */

interface ProductMetadata {
    brand: string;
    model: string;
    year: number;
    category: string;
    isEbike: boolean;
    specs: {
        motor?: string;
        battery?: string;
        capacity?: string;
        frame?: string;
        groupset?: string;
        suspension?: string;
    };
    minPrice?: number;
    maxPrice?: number;
}

/**
 * Extract key specs for meta description based on bike type
 */
function getKeySpecs(product: ProductMetadata): string {
    const { isEbike, specs } = product;

    if (isEbike) {
        // For e-bikes: prioritize motor and battery
        const parts: string[] = [];

        if (specs.motor) {
            // Simplify motor name (e.g., "Bosch Performance Line CX" → "Bosch CX")
            const motorSimplified = specs.motor
                .replace(/Performance Line/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            parts.push(`Motor ${motorSimplified}`);
        }

        if (specs.battery || specs.capacity) {
            const battery = specs.battery || specs.capacity || '';
            // Extract Wh value if present
            const whMatch = battery.match(/(\d+)\s*Wh/i);
            if (whMatch) {
                parts.push(`baterie ${whMatch[1]} Wh`);
            } else if (battery) {
                parts.push(`baterie ${battery}`);
            }
        }

        if (specs.frame) {
            parts.push(specs.frame.toLowerCase());
        }

        return parts.join(', ');
    } else {
        // For regular bikes: prioritize groupset, suspension, frame
        const parts: string[] = [];

        if (specs.groupset) {
            parts.push(specs.groupset);
        }

        if (specs.suspension) {
            parts.push(specs.suspension);
        }

        if (specs.frame) {
            parts.push(specs.frame.toLowerCase());
        }

        return parts.join(', ');
    }
}

/**
 * Generate SEO-optimized title for product page
 */
export function generateProductTitle(product: ProductMetadata): string {
    const { brand, model, isEbike, specs } = product;

    // Get key spec for title (usually motor+battery for e-bikes, or main feature for regular)
    let keySpec = '';

    if (isEbike && specs.motor) {
        // Simplify motor name for title
        const motorShort = specs.motor
            .replace(/Performance Line/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Add battery if available
        const battery = specs.battery || specs.capacity || '';
        const whMatch = battery.match(/(\d+)\s*Wh/i);

        if (whMatch) {
            keySpec = `${motorShort} ${whMatch[1]}Wh`;
        } else {
            keySpec = motorShort;
        }
    } else if (!isEbike && specs.groupset) {
        keySpec = specs.groupset;
    }

    // Build title
    const parts = [brand, model];
    if (keySpec) {
        parts.push(`– ${keySpec}`);
    }
    parts.push('| Biketime.cz');

    return parts.join(' ');
}

/**
 * Generate SEO-optimized description for product page
 */
export function generateProductDescription(product: ProductMetadata): string {
    const { brand, model, year, category, isEbike, minPrice } = product;

    const keySpecs = getKeySpecs(product);

    // Build description
    const bikeType = isEbike ? 'elektrokola' : 'kola';
    const parts: string[] = [];

    // Opening
    parts.push(`Detailní specifikace ${bikeType} ${brand} ${model}`);

    // Year
    if (year) {
        parts.push(`${year}`);
    }

    // Key specs
    if (keySpecs) {
        parts.push(`– ${keySpecs}`);
    }

    // Category
    if (category) {
        parts.push(`Kategorie: ${category}.`);
    }

    // Price (if available)
    if (minPrice) {
        parts.push(`Cena od ${minPrice.toLocaleString('cs-CZ')} Kč.`);
    }

    // Call to action
    parts.push('Zjistit dostupnost.');

    return parts.join('. ').replace(/\.\./g, '.');
}

/**
 * Generate complete metadata object for product page
 */
export function generateProductMetadata(product: ProductMetadata) {
    const title = generateProductTitle(product);
    const description = generateProductDescription(product);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'product' as const,
            images: product.isEbike
                ? [{ url: '/opengraph-image.png', width: 1200, height: 630 }]
                : [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image' as const,
            title,
            description,
        },
    };
}
