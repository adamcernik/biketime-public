import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is designed to run ONLY on the server side (Node.js environment).
// It uses "firebase-admin" to bypass Firestore security rules for admin tasks.

// Dedicated name for OUR credentialed admin app. Must NOT be the default app
// nor share a name with the credential-less verifier app in userAuth.ts
// ('id-token-verifier'). See the reuse note below.
const ADMIN_APP_NAME = 'admin-credentialed';

function getFirebaseAdminApp() {
    // Reuse ONLY our own credentialed app — look it up by name. Do NOT return
    // getApps()[0]: userAuth.ts registers a SEPARATE credential-less admin app
    // ('id-token-verifier', projectId only) for ID-token verification. If that
    // verifier app was registered first on this serverless instance (which
    // happens whenever a route calls isAuthenticatedRequest() before its first
    // adminDb access — e.g. /api/catalog), getApps()[0] would return it, and
    // getFirestore() on a credential-less app fails at read time with
    // "Could not load the default credentials." That race poisoned random
    // serverless instances and caused the intermittent catalog/accessories
    // outages. Matching by name makes adminDb always use the credentialed app.
    const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
    if (existing) {
        return existing;
    }

    // Parse the Service Account form environment variable
    // We expect the whole JSON content in FIREBASE_SERVICE_ACCOUNT_KEY
    // OR individual fields if you prefer (project_id, private_key, client_email)

    // NOTE: When using Vercel, it is easier to base64 encode the whole JSON file 
    // and store it in one variable: FIREBASE_SERVICE_ACCOUNT_BASE64

    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
            const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64');
            serviceAccount = JSON.parse(buffer.toString('utf-8'));
        } catch {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64');
        }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Direct JSON string (careful with newlines/escaping in some envs)
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
        }
    }

    // Fallback or explicit values
    if (!serviceAccount) {
        // Check if we have individual vars (common fallback)
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle private key newlines correctly
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            };
        }
    }

    if (!serviceAccount) {
        // No credentials resolved. Log WHICH env vars the runtime actually sees
        // (presence only, never values) so we can tell whether Vercel is failing
        // to inject them. THROW instead of initializeApp() with no creds: a
        // credential-less app would be cached by getApps() and poison every later
        // request on this instance. Throwing keeps getApps() empty so the next
        // request re-attempts and self-heals once the env is present.
        console.error('Firebase Admin: no service account resolved. env presence:', JSON.stringify({
            base64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
            json: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
            projectId: !!process.env.FIREBASE_PROJECT_ID,
            clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLen: (process.env.FIREBASE_PRIVATE_KEY || '').length,
        }));
        throw new Error('Firebase Admin: no service account credentials found in environment.');
    }

    return initializeApp({
        credential: cert(serviceAccount),
        // databaseURL: `https://${serviceAccount.projectId}.firebaseio.com` // Optional for Firestore
    }, ADMIN_APP_NAME);
}

// Lazy initialization: credentials are parsed on first use, not at import time.
// This keeps `next build` (page-data collection) from evaluating the service
// account key, and avoids crashing the whole app on a misconfigured env.
function lazy<T extends object>(factory: () => T): T {
    let instance: T | undefined;
    return new Proxy({} as T, {
        get(_target, prop) {
            instance ??= factory();
            const value = instance[prop as keyof T];
            return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
        },
    });
}

export const adminDb = lazy(() => getFirestore(getFirebaseAdminApp()));
export const adminAuth = lazy(() => getAuth(getFirebaseAdminApp()));
