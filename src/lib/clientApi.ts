import { auth } from '@/lib/firebase';

/**
 * fetch() that attaches the signed-in user's Firebase ID token (when present),
 * so public catalog/accessory APIs can return dealer (B2B) prices to approved
 * shop users. Anonymous callers get a plain fetch (no prices). Never throws on
 * token errors — falls back to an unauthenticated request.
 */
export async function apiGet(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  try {
    if (auth) {
      // Wait until Firebase has restored the session, so a logged-in user's
      // token is attached even if the request fires right after mount.
      await auth.authStateReady?.();
      const user = auth.currentUser;
      if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
    }
  } catch {
    /* not signed in / token unavailable → anonymous request */
  }
  return fetch(input, { ...init, headers });
}
