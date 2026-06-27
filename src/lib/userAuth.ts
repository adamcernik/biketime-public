import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Verifies Firebase ID tokens WITHOUT a service account.
 *
 * verifyIdToken only needs the project id + Google's public keys (fetched over
 * the network), not the service-account private key. We use a dedicated,
 * credential-less admin app initialized with just `projectId` so token
 * verification keeps working even where the service-account credential is
 * unavailable/misconfigured.
 */
const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  '';

const VERIFIER_APP = 'id-token-verifier';

function verifierAuth() {
  const existing = getApps().find((a) => a.name === VERIFIER_APP);
  const app = existing || initializeApp({ projectId: PROJECT_ID }, VERIFIER_APP);
  return getAuth(app);
}

/**
 * True when the request carries a valid Firebase ID token (i.e. a logged-in
 * user) for this project. Used to decide whether a public API may include
 * dealer (B2B) prices — matching the catalog UI, which shows dealer prices to
 * logged-in shop users. Fails closed.
 */
export async function isAuthenticatedRequest(request: Request): Promise<boolean> {
  try {
    const header = request.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return false;
    const token = header.slice(7).trim();
    if (!token) return false;
    await verifierAuth().verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies the request's Firebase ID token and returns the user's identity
 * (uid/email/name) from the token, or null. Lets a route act on the
 * authenticated user's OWN email only — never an attacker-supplied address.
 */
export async function getVerifiedUser(
  request: Request,
): Promise<{ uid: string; email?: string; name?: string } | null> {
  try {
    const header = request.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    const token = header.slice(7).trim();
    if (!token) return null;
    const decoded = await verifierAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
}
