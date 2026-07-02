import { describe, it, expect } from 'vitest';
import { mapAresResponse } from './ares';

// Shape mirrors the real ARES v3 response (verified live against
// ares.gov.cz for 27604977 / 45274649).
const fullResponse = {
    ico: '27604977',
    obchodniJmeno: 'Google Czech Republic, s.r.o.',
    dic: 'CZ27604977',
    pravniForma: '112',
    datumVzniku: '2006-09-27',
    sidlo: {
        nazevUlice: 'Stroupežnického',
        cisloDomovni: 3191,
        cisloOrientacni: 17,
        nazevObce: 'Praha',
        psc: 15000,
        kodStatu: 'CZ',
        textovaAdresa: 'Stroupežnického 3191/17, Smíchov, 15000 Praha 5',
    },
};

describe('mapAresResponse', () => {
    it('maps a full response', () => {
        expect(mapAresResponse(fullResponse)).toEqual({
            ico: '27604977',
            vatId: 'CZ27604977',
            legalName: 'Google Czech Republic, s.r.o.',
            street: 'Stroupežnického 3191/17',
            city: 'Praha',
            zip: '15000',
            country: 'CZ',
            legalFormCode: '112',
            foundedAt: '2006-09-27',
            isVatPayer: true,
        });
    });

    it('treats a missing dic as non-VAT payer', () => {
        const withoutDic: Record<string, unknown> = { ...fullResponse };
        delete withoutDic.dic;
        const mapped = mapAresResponse(withoutDic);
        expect(mapped.vatId).toBeNull();
        expect(mapped.isVatPayer).toBe(false);
    });

    it('joins house number without slash when orientační číslo is missing', () => {
        const mapped = mapAresResponse({
            ...fullResponse,
            sidlo: { ...fullResponse.sidlo, cisloOrientacni: undefined },
        });
        expect(mapped.street).toBe('Stroupežnického 3191');
    });

    it('falls back to textovaAdresa when structured street is missing', () => {
        const mapped = mapAresResponse({
            ...fullResponse,
            sidlo: {
                nazevObce: 'Praha',
                psc: 15000,
                kodStatu: 'CZ',
                textovaAdresa: 'Stroupežnického 3191/17, Smíchov, 15000 Praha 5',
            },
        });
        expect(mapped.street).toBe('Stroupežnického 3191/17, Smíchov, 15000 Praha 5');
    });

    it('strips spaces from zip and stringifies numeric psc', () => {
        const mapped = mapAresResponse({
            ...fullResponse,
            sidlo: { ...fullResponse.sidlo, psc: '150 00' },
        });
        expect(mapped.zip).toBe('15000');
    });

    it('survives a missing sidlo entirely (defaults, country CZ)', () => {
        const mapped = mapAresResponse({ ico: '27604977', obchodniJmeno: 'X' });
        expect(mapped.street).toBe('');
        expect(mapped.city).toBe('');
        expect(mapped.zip).toBe('');
        expect(mapped.country).toBe('CZ');
    });
});
