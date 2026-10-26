import { auth } from '@/lib/firebase';

/**
 * Nejdelší doba, po kterou čekáme na obnovení Firebase session, než pošleme
 * požadavek anonymně. Safari občas zasekne IndexedDB (persistence Firebase
 * Auth) a `authStateReady()` se pak nikdy nevyřeší — bez limitu by se
 * veřejný katalog vůbec nenačetl.
 */
const AUTH_READY_TIMEOUT_MS = 2500;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(undefined), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, () => { clearTimeout(t); resolve(undefined); });
  });
}

/**
 * fetch() that attaches the signed-in user's Firebase ID token (when present),
 * so public catalog/accessory APIs can return dealer (B2B) prices to approved
 * shop users. Anonymous callers get a plain fetch (no prices). Never throws on
 * token errors — falls back to an unauthenticated request.
 */
export async function apiGet(
  input: string,
  init: RequestInit = {},
  opts: {
    /**
     * Zavolá se těsně před odesláním s uid uživatele, jehož token požadavek
     * nese (null = anonymní). Stránky podle toho poznají, že první načtení
     * odešlo bez tokenu, a po obnovení session ho zopakují.
     */
    onAuth?: (uid: string | null) => void;
  } = {},
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  let uid: string | null = null;
  try {
    if (auth) {
      // Wait until Firebase has restored the session, so a logged-in user's
      // token is attached even if the request fires right after mount — but
      // never block the public request on auth init (see AUTH_READY_TIMEOUT_MS).
      if (auth.authStateReady) await withTimeout(auth.authStateReady(), AUTH_READY_TIMEOUT_MS);
      const user = auth.currentUser;
      if (user) {
        const token = await withTimeout(user.getIdToken(), AUTH_READY_TIMEOUT_MS);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          uid = user.uid;
        }
      }
    }
  } catch {
    /* not signed in / token unavailable → anonymous request */
  }
  opts.onAuth?.(uid);
  return fetch(input, { ...init, headers });
}
