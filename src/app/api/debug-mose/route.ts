import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export async function GET() {
    try {
        const bikesRef = collection(db, 'bikes');
        const q = query(bikesRef, limit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json({ message: 'No bikes found' });
        }

        const bike = snap.docs[0].data();
        return NextResponse.json({
            id: snap.docs[0].id,
            specifications: bike.specifications,
            keys: Object.keys(bike)
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
