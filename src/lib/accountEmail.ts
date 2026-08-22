import 'server-only';
import { Resend } from 'resend';

// E-mail operátorovi o žádosti o zrušení účtu. Best-effort — žádost je už
// zapsaná na users/{uid}.deletionRequestedAt, e-mail je jen notifikace.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';
const NOTIFY_TO = process.env.REGISTRATION_NOTIFY_EMAIL || 'info@biketime.cz';
const ADMIN_URL = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';

const resend = apiKey ? new Resend(apiKey) : null;

function esc(v: unknown): string {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendDeletionRequestToAdmin(d: {
    uid: string;
    email: string;
    companyName?: string;
    contactName?: string;
    reason?: string;
}): Promise<boolean> {
    if (!resend) {
        console.warn('[accountEmail] RESEND_API_KEY not set — skipping deletion notify');
        return false;
    }
    try {
        await resend.emails.send({
            from: FROM,
            to: NOTIFY_TO,
            subject: `Žádost o zrušení účtu: ${d.companyName || d.email}`,
            html: `
        <p>Partner požádal o zrušení svého účtu na biketime.cz:</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:2px 12px 2px 0;color:#888">Firma</td><td><strong>${esc(d.companyName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Kontakt</td><td><strong>${esc(d.contactName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">E-mail</td><td><strong>${esc(d.email)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">UID</td><td style="font-family:monospace">${esc(d.uid)}</td></tr>
        </table>
        ${d.reason ? `<p><span style="color:#888">Důvod:</span> ${esc(d.reason)}</p>` : ''}
        <p style="margin-top:16px"><a href="${ADMIN_URL}/admin/users"
          style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
          Otevřít správu uživatelů</a></p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[accountEmail] deletion notify failed:', e);
        return false;
    }
}
