import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { getVerifiedUser } from '@/lib/userAuth';

export interface ApprovedCustomer {
    uid: string;
    email: string;
    companyName: string;
    contactName: string;
    phone: string;
    priceLevel?: 'A' | 'B' | 'C' | 'D';
}

/**
 * Ověří Firebase ID token a schválení partnera (users/{uid}.hasAccess).
 * Vrací profil pro objednávky/ceník, nebo null (→ 401).
 */
export async function getApprovedCustomer(request: Request): Promise<ApprovedCustomer | null> {
    const caller = await getVerifiedUser(request);
    if (!caller) return null;
    const userSnap = await adminDb.collection('users').doc(caller.uid).get();
    if (!userSnap.exists || userSnap.get('hasAccess') !== true) return null;
    const u = userSnap.data() as Record<string, unknown>;
    const contactName = [u.firstName, u.lastName].filter(Boolean).join(' ')
        || (typeof u.displayName === 'string' ? u.displayName : '');
    return {
        uid: caller.uid,
        email: caller.email || (typeof u.email === 'string' ? u.email : ''),
        companyName: typeof u.companyName === 'string' ? u.companyName : '',
        contactName,
        phone: typeof u.phone === 'string' ? u.phone : '',
        priceLevel: (typeof u.priceLevel === 'string' ? u.priceLevel : undefined) as
            | 'A' | 'B' | 'C' | 'D' | undefined,
    };
}
