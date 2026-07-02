/**
 * ARES (Administrativní registr ekonomických subjektů) client — server-only.
 *
 * Public JSON REST API of the Czech Ministry of Finance. No API key, no auth.
 * We fetch a single ekonomický subjekt by IČO and map the subset we need.
 *
 * IMPORTANT: only the mapped subset (CompanyData) may leave the server. The raw
 * response is cached server-side (aresCache) but never sent to the browser.
 */

const ARES_BASE =
    'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty';

/** Mapped, client-safe company data. No prices, no raw ARES payload. */
export type CompanyData = {
    ico: string;
    vatId: string | null;
    legalName: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    legalFormCode: string | null;
    foundedAt: string | null;
    isVatPayer: boolean;
};

export type AresFetchResult =
    | { kind: 'ok'; data: CompanyData; raw: Record<string, unknown> }
    | { kind: 'not_found' }
    | { kind: 'terminated' }
    | { kind: 'unavailable' };

/**
 * Fetch a single subject from ARES by (already validated) IČO.
 * Resilient: a timeout, non-2xx (other than 404) or parse error → 'unavailable'
 * so the caller can fall back to manual entry instead of failing the form.
 */
export async function fetchFromAres(ico: string): Promise<AresFetchResult> {
    let res: Response;
    try {
        res = await fetch(`${ARES_BASE}/${ico}`, {
            signal: AbortSignal.timeout(5000),
            headers: { accept: 'application/json' },
        });
    } catch {
        return { kind: 'unavailable' };
    }

    if (res.status === 404) return { kind: 'not_found' };
    if (!res.ok) return { kind: 'unavailable' };

    let raw: Record<string, unknown>;
    try {
        raw = (await res.json()) as Record<string, unknown>;
    } catch {
        return { kind: 'unavailable' };
    }

    // A terminated company (datumZaniku set) must block, not autofill.
    if (raw.datumZaniku) return { kind: 'terminated' };

    return { kind: 'ok', data: mapAresResponse(raw), raw };
}

/** Map a raw ARES response to our client-safe CompanyData. */
export function mapAresResponse(raw: Record<string, unknown>): CompanyData {
    const s = (raw.sidlo ?? {}) as Record<string, unknown>;

    const houseNo = [s.cisloDomovni, s.cisloOrientacni]
        .filter((v) => v !== undefined && v !== null && v !== '')
        .join('/');
    const streetParts = [s.nazevUlice, houseNo].filter(Boolean);
    const street = streetParts.join(' ') || String(s.textovaAdresa ?? '');

    const dic = typeof raw.dic === 'string' && raw.dic ? raw.dic : null;

    return {
        ico: String(raw.ico ?? ''),
        vatId: dic,
        legalName: String(raw.obchodniJmeno ?? ''),
        street,
        city: String(s.nazevObce ?? ''),
        zip: String(s.psc ?? '').replace(/\s/g, ''),
        country: String(s.kodStatu ?? 'CZ'),
        legalFormCode: raw.pravniForma != null ? String(raw.pravniForma) : null,
        foundedAt: raw.datumVzniku != null ? String(raw.datumVzniku) : null,
        // Heuristic: ARES exposes `dic` for VAT payers. Authoritative payer
        // status lives in ADISREG (nice-to-have, not MVP).
        isVatPayer: !!dic,
    };
}
