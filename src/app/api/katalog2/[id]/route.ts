/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Single product detail from products_v3
 * Maps to ProductV2-compatible shape for the detail page
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const docRef = doc(db, 'products_v3', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const data = snapshot.data();
        const specs = data.specs || {};
        const variants = (data.variants || []) as any[];

        // Map variants to detail page format
        // Group by color and detect capacity differences
        const mappedVariants = variants.map((v: any) => {
            // Extract battery capacity for this variant
            // In ProductV3, battery capacity is at specs level (shared)
            // But if product hasMultipleBatteries, we need to look at variant-level hints
            // For now, use the shared specs.batteryCapacity
            const capacity = specs.batteryCapacity || '';

            return {
                id: v.nrLf,
                ean: v.ean || '',
                nrLf: v.nrLf,
                lfSn: v.lfSn || '',
                size: v.rahmenGroesse || v.sizeCode || '',
                color: v.farbe || '',
                frameShape: v.rahmenTyp || '',
                price: v.moc || v.uvpPl || 0,
                images: v.images || [],
                capacity,
                // Stock (Phase 2)
                stock: v.b2bStockQuantity || 0,
                b2bStockQuantity: v.b2bStockQuantity || 0,
                b2bOrderStatus: v.b2bOrderStatus || '',
                // B2B prices
                b2bPrice: v.priceC || 0,
            };
        });

        // Compute price range
        const allPrices = mappedVariants.map((v: any) => v.price).filter((p: number) => p > 0);
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

        // Compute B2B price levels from first variant with prices
        const priceLevelsCzk: Partial<Record<'A' | 'B' | 'C' | 'D', number>> = {};
        const firstWithPrices = variants.find((v: any) => v.priceC && v.priceC > 0);
        if (firstWithPrices) {
            if (firstWithPrices.priceA) priceLevelsCzk.A = firstWithPrices.priceA;
            if (firstWithPrices.priceB) priceLevelsCzk.B = firstWithPrices.priceB;
            if (firstWithPrices.priceC) priceLevelsCzk.C = firstWithPrices.priceC;
            if (firstWithPrices.priceD) priceLevelsCzk.D = firstWithPrices.priceD;
        }

        // Fetch color mappings
        let colorMappings: Record<string, string> = {};
        try {
            const colorSnap = await getDoc(doc(db, 'settings', 'color_mappings'));
            if (colorSnap.exists()) {
                colorMappings = (colorSnap.data().mappings as Record<string, string>) || {};
            }
        } catch (e) {
            console.error('Failed to load color mappings:', e);
        }

        const product = {
            id: snapshot.id,
            brand: data.marke || '',
            model: data.modell || '',
            year: data.modelljahr || 0,
            category: specs.category || '',
            specs: {
                motor: specs.motor || '',
                motorManufacturer: specs.motorManufacturer || '',
                motorType: specs.motorType || '',
                motorPower: specs.motorPower || '',
                motorTorque: specs.motorTorque || '',
                motorSupport: specs.motorSupport || '',
                batteryManufacturer: specs.batteryManufacturer || '',
                battery: specs.battery || '',
                capacity: specs.batteryCapacity || '',
                batteryType: specs.batteryType || '',
                charger: specs.charger || '',
                display: specs.display || '',
                remote: specs.remote || '',
                frame: specs.frame || '',
                frameMaterial: specs.frameMaterial || '',
                fork: specs.fork || '',
                travelFork: specs.travelFork || '',
                rearSuspension: specs.rearSuspension || '',
                travelRear: specs.travelRear || '',
                headset: specs.headset || '',
                wheelSize: specs.wheelSize || '',
                tireSize: specs.tireSize || '',
                tireSizeInch: specs.tireSizeInch || '',
                tires: specs.tires || '',
                rims: specs.rims || '',
                wheelset: specs.wheelset || '',
                hubFront: specs.hubFront || '',
                hubRear: specs.hubRear || '',
                gears: specs.gears || '',
                derailleurType: specs.derailleurType || '',
                rearDerailleur: specs.rearDerailleur || '',
                frontDerailleur: specs.frontDerailleur || '',
                shifter: specs.shifter || '',
                crankset: specs.crankset || '',
                cassette: specs.cassette || '',
                chain: specs.chain || '',
                pedals: specs.pedals || '',
                brakes: specs.brakes || '',
                brakeLever: specs.brakeLever || '',
                brakeFront: specs.brakeFront || '',
                brakeRear: specs.brakeRear || '',
                brakeDiscFront: specs.brakeDiscFront || '',
                brakeDiscRear: specs.brakeDiscRear || '',
                coasterBrake: specs.coasterBrake || '',
                handlebar: specs.handlebar || '',
                stem: specs.stem || '',
                grips: specs.grips || '',
                saddle: specs.saddle || '',
                seatpost: specs.seatpost || '',
                frontLight: specs.frontLight || '',
                rearLight: specs.rearLight || '',
                carrier: specs.carrier || '',
                mudguards: specs.mudguards || '',
                stand: specs.stand || '',
                lock: specs.lock || '',
                gps: specs.gps || '',
                monkeyLink: specs.monkeyLink || '',
                monkeyLoad: specs.monkeyLoad || '',
                weight: specs.weight || '',
                weightNoBattery: specs.weightNoBattery || '',
                maxWeight: specs.maxWeight || '',
                intendedUse: specs.intendedUse || '',
                fieldOfApplication: specs.fieldOfApplication || '',
            },
            variants: mappedVariants,
            images: data.primaryImage ? [data.primaryImage] : (variants[0]?.images || []),
            minPrice,
            maxPrice,
            priceLevelsCzk: Object.keys(priceLevelsCzk).length > 0 ? priceLevelsCzk : undefined,
        };

        return NextResponse.json({ ...product, colorMappings });
    } catch (error) {
        console.error('Katalog2 Detail Error:', error);
        return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
    }
}
