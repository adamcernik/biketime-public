import 'server-only';
import { Resend } from 'resend';

// Registration acknowledgement e-mail (Resend). Best-effort: a Resend outage must
// never break sign-up — callers swallow/ignore failures.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';
const NOTIFY_TO = process.env.REGISTRATION_NOTIFY_EMAIL || 'info@biketime.cz';
const ADMIN_URL = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';

const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Tells a freshly registered shop owner we received their request and will
 * contact them once approved. Sends to the user's own (token-verified) e-mail.
 * Returns true if sent.
 */
export async function sendRegistrationAck(to: string, name?: string): Promise<boolean> {
  if (!resend) {
    console.warn('[registrationEmail] RESEND_API_KEY not set — skipping');
    return false;
  }
  if (!to) return false;

  const greeting = name ? `Dobrý den ${name},` : 'Dobrý den,';
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Registrace na biketime.cz — zpracováváme ji',
      html: `
        <p>${greeting}</p>
        <p>děkujeme za registraci do velkoobchodního (B2B) systému
        <strong>biketime.cz</strong>. Vaši žádost jsme přijali a&nbsp;<strong>zpracováváme ji</strong>.</p>
        <p>Jakmile registraci schválíme, ozveme se vám a získáte přístup
        k&nbsp;velkoobchodním cenám a&nbsp;katalogu kol BULLS.</p>
        <p>Děkujeme za trpělivost.</p>
        <p>S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Tento e-mail byl odeslán automaticky po registraci na biketime.cz.
        Pokud jste se neregistrovali, můžete jej ignorovat.</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[registrationEmail] send failed:', e);
    return false;
  }
}

export interface RegistrationDetails {
  email: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyAddress?: string;
}

/**
 * Internal notification to info@biketime.cz that a new shop submitted a
 * registration, with a link to the admin where it gets approved.
 */
export async function sendRegistrationNotifyToAdmin(d: RegistrationDetails): Promise<boolean> {
  if (!resend) {
    console.warn('[registrationEmail] RESEND_API_KEY not set — skipping admin notify');
    return false;
  }
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ') || '—';
  const row = (k: string, v?: string) => `<tr><td style="padding:2px 12px 2px 0;color:#888">${k}</td><td><strong>${v || '—'}</strong></td></tr>`;
  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      subject: `Nová registrace zákazníka — ${d.companyName || d.email}`,
      html: `
        <p>Nový zákazník odeslal registraci do B2B systému biketime.cz:</p>
        <table style="border-collapse:collapse;font-size:14px">
          ${row('Firma', d.companyName)}
          ${row('Kontakt', fullName)}
          ${row('E-mail', d.email)}
          ${row('Telefon', d.phone)}
          ${row('Adresa', d.companyAddress)}
        </table>
        <p style="margin-top:16px"><a href="${ADMIN_URL}/admin/users"
          style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
          Otevřít v administraci a schválit</a></p>
        <p style="color:#888;font-size:12px">${ADMIN_URL}/admin/users</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[registrationEmail] admin notify failed:', e);
    return false;
  }
}

/**
 * Tells an approved shop owner their registration was approved and they now
 * have access. Sent when an admin approves them in the dashboard.
 */
export async function sendApprovalEmail(to: string, name?: string): Promise<boolean> {
  if (!resend) {
    console.warn('[registrationEmail] RESEND_API_KEY not set — skipping approval mail');
    return false;
  }
  if (!to) return false;
  const greeting = name ? `Dobrý den ${name},` : 'Dobrý den,';
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Vaše registrace na biketime.cz byla schválena 🎉',
      html: `
        <p>${greeting}</p>
        <p>dobrá zpráva — vaši registraci do velkoobchodního (B2B) systému
        <strong>biketime.cz</strong> jsme <strong>schválili</strong>. Od této chvíle máte
        přístup k&nbsp;velkoobchodním cenám a&nbsp;kompletnímu katalogu kol BULLS.</p>
        <p style="margin:20px 0"><a href="https://www.biketime.cz/login"
          style="display:inline-block;background:#e30613;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
          Přihlásit se a začít nakupovat</a></p>
        <p>Stačí se přihlásit stejným účtem, kterým jste se registrovali. Pokud byste cokoli
        potřebovali doladit nebo měli dotaz, neváhejte se nám ozvat.</p>
        <p>S pozdravem,<br/>tým Biketime</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[registrationEmail] approval mail failed:', e);
    return false;
  }
}
