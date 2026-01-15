import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is designed to run ONLY on the server side (Node.js environment).
// It uses "firebase-admin" to bypass Firestore security rules for admin tasks.

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
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
        // Development fallback: warn but don't crash yet, it might work if GCloud CLI is logged in locally
        console.warn('⚠️ No Service Account found. Admin SDK might act as default credentials or fail.');
        return initializeApp();
    }

    return initializeApp({
        credential: cert(serviceAccount),
        // databaseURL: `https://${serviceAccount.projectId}.firebaseio.com` // Optional for Firestore
    });
}

const adminApp = getFirebaseAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
