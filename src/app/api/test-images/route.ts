import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Get a few bikes with images
        const bikesRef = collection(db, 'bikes');
        const q = query(bikesRef, limit(5));
        const snap = await getDocs(q);

        const bikes = snap.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    marke: data.marke,
                    modell: data.modell,
                    bild1: data.bild1,
                    nrLf: data.nrLf,
                    ean: data.EAN || data.ean
                };
            })
            .filter(bike => bike.bild1); // Only bikes with images

        return NextResponse.json({ bikes });
    } catch (error) {
        console.error('Error fetching bikes:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
