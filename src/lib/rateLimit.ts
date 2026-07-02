import { adminDb } from './firebase-admin';

/**
 * Fixed-window rate limiter backed by Firestore (no Redis/KV dependency).
 *
 * Counters live in `rateLimits/{key}:{windowStart}`. A transaction increments
 * the current window's count; over the limit → denied. Works across serverless
 * instances (unlike in-memory counters). Old window docs are harmless leftovers;
 * a native Firestore TTL policy on `expiresAt` (or the cleanup cron) reaps them.
 *
 * This is a coarse abuse guard, not a precise sliding window — good enough to
 * stop someone using our endpoint as a free ARES proxy and getting us blacklisted.
 */
export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
): Promise<boolean> {
    const windowMs = windowSeconds * 1000;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const docId = `${key}:${windowStart}`.replace(/\//g, '_');
    const ref = adminDb.collection('rateLimits').doc(docId);

    try {
        return await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const count = snap.exists ? (snap.data()?.count as number) ?? 0 : 0;
            if (count >= limit) return false;
            tx.set(
                ref,
                { count: count + 1, windowStart, expiresAt: new Date(windowStart + windowMs) },
                { merge: true },
            );
            return true;
        });
    } catch {
        // Fail OPEN: a Firestore hiccup must not lock everyone out of registration.
        // The upstream ARES rate limit (~500/min) is the real backstop.
        return true;
    }
}
