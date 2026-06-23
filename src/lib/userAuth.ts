import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * True when the request carries a valid Firebase ID token belonging to an
 * approved shop user (users/{uid}.hasAccess === true). Used to decide whether a
 * public API may include dealer (B2B) prices in its response. Fails closed.
 */
export async function isApprovedShopRequest(request: Request): Promise<boolean> {
  try {
    const header = request.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return false;
    const token = header.slice(7).trim();
    if (!token) return false;
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    return snap.exists && (snap.data()?.hasAccess === true);
  } catch {
    return false;
  }
}
