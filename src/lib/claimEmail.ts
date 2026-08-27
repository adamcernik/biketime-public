import 'server-only';
import { Resend } from 'resend';

// E-maily k reklamacím (Resend). Best-effort: výpadek e-mailu nesmí ztratit
// reklamaci — ta je v okamžiku volání už uložená ve Firestore.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';
const NOTIFY_TO = process.env.CLAIM_NOTIFY_EMAIL
    || process.env.ORDER_NOTIFY_EMAIL
    || process.env.REGISTRATION_NOTIFY_EMAIL
    || 'info@biketime.cz';
const ADMIN_URL = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';

const resend = apiKey ? new Resend(apiKey) : null;

/** HTML-escape uživatelských hodnot vkládaných do e-mailu. */
function esc(v: unknown): string {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export type ClaimStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
    new: 'Nová',
    in_progress: 'V řešení',
    resolved: 'Vyřízeno',
    rejected: 'Zamítnuto',
};

export interface ClaimEmailData {
    claimId: string;
    email: string;
    companyName?: string;
    contactName?: string;
    phone?: string;
    frameNumber: string;
    description: string;
    mediaCount: number;
}

/** Interní notifikace o nové reklamaci. */
export async function sendClaimNotifyToAdmin(d: ClaimEmailData): Promise<boolean> {
    if (!resend) {
        console.warn('[claimEmail] RESEND_API_KEY not set — skipping admin notify');
        return false;
    }
    try {
        await resend.emails.send({
            from: FROM,
            to: NOTIFY_TO,
            subject: `Nová reklamace: ${d.companyName || d.email} — ${d.frameNumber}`,
            html: `
        <p>Partner založil reklamaci / servisní případ:</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:2px 12px 2px 0;color:#888">Firma</td><td><strong>${esc(d.companyName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Kontakt</td><td><strong>${esc(d.contactName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">E-mail</td><td><strong>${esc(d.email)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Telefon</td><td><strong>${esc(d.phone) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Rámové číslo / BikeID</td><td><strong>${esc(d.frameNumber)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Příloh</td><td><strong>${d.mediaCount}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Č. případu</td><td><strong>${esc(d.claimId)}</strong></td></tr>
        </table>
        <p style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px">${esc(d.description)}</p>
        <p style="margin-top:16px"><a href="${ADMIN_URL}/admin/reklamace"
          style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
          Otevřít v administraci</a></p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[claimEmail] admin notify failed:', e);
        return false;
    }
}

/** Potvrzení partnerovi, že jsme reklamaci přijali. */
export async function sendClaimAck(d: ClaimEmailData): Promise<boolean> {
    if (!resend) {
        console.warn('[claimEmail] RESEND_API_KEY not set — skipping ack');
        return false;
    }
    if (!d.email) return false;
    const greeting = d.contactName ? `Dobrý den ${esc(d.contactName)},` : 'Dobrý den,';
    try {
        await resend.emails.send({
            from: FROM,
            to: d.email,
            subject: 'Přijali jsme vaši reklamaci — Biketime',
            html: `
        <p>${greeting}</p>
        <p>přijali jsme váš servisní případ a&nbsp;ozveme se, jakmile ho posoudíme.
        Stav můžete sledovat v&nbsp;klientské zóně na biketime.cz.</p>
        <table style="border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr><td style="padding:2px 12px 2px 0;color:#888">Rámové číslo / BikeID</td><td><strong>${esc(d.frameNumber)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Příloh</td><td><strong>${d.mediaCount}</strong></td></tr>
        </table>
        <p style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px">${esc(d.description)}</p>
        <p style="margin-top:16px">S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Číslo případu: ${esc(d.claimId)}. Tento e-mail byl odeslán automaticky z biketime.cz.</p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[claimEmail] ack failed:', e);
        return false;
    }
}

export interface ClaimStatusEmailData {
    claimId: string;
    email: string;
    contactName?: string;
    frameNumber: string;
    status: ClaimStatus;
    adminNote?: string;
}

/** Oznámení partnerovi o změně stavu / vyjádření k reklamaci. */
export async function sendClaimStatusToDealer(d: ClaimStatusEmailData): Promise<boolean> {
    if (!resend) {
        console.warn('[claimEmail] RESEND_API_KEY not set — skipping status mail');
        return false;
    }
    if (!d.email) return false;
    const label = CLAIM_STATUS_LABELS[d.status] || d.status;
    const greeting = d.contactName ? `Dobrý den ${esc(d.contactName)},` : 'Dobrý den,';
    try {
        await resend.emails.send({
            from: FROM,
            to: d.email,
            subject: `Reklamace ${d.frameNumber}: ${label} — Biketime`,
            html: `
        <p>${greeting}</p>
        <p>u&nbsp;vašeho servisního případu (rámové číslo / BikeID <strong>${esc(d.frameNumber)}</strong>)
        došlo ke změně:</p>
        <p style="font-size:16px">Stav: <strong>${esc(label)}</strong></p>
        ${d.adminNote ? `<p style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px"><span style="color:#888">Vyjádření Biketime:</span><br/>${esc(d.adminNote)}</p>` : ''}
        <p>Podrobnosti najdete v&nbsp;klientské zóně na biketime.cz v&nbsp;sekci Reklamace.</p>
        <p style="margin-top:16px">S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Číslo případu: ${esc(d.claimId)}. Tento e-mail byl odeslán automaticky z biketime.cz.</p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[claimEmail] status mail failed:', e);
        return false;
    }
}
