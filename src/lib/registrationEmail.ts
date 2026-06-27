import 'server-only';
import { Resend } from 'resend';

// Registration acknowledgement e-mail (Resend). Best-effort: a Resend outage must
// never break sign-up — callers swallow/ignore failures.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';

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
