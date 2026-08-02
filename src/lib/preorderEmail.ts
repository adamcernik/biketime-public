import 'server-only';
import { Resend } from 'resend';

// Preorder e-mails (Resend). Best-effort: an e-mail outage must never lose an
// order — the order is already persisted in Firestore before these are called.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';
const NOTIFY_TO = process.env.PREORDER_NOTIFY_EMAIL || process.env.REGISTRATION_NOTIFY_EMAIL || 'info@biketime.cz';
const ADMIN_URL = process.env.B2B_ADMIN_URL || 'https://b2b.biketime.cz';

const resend = apiKey ? new Resend(apiKey) : null;

export interface PreorderEmailItem {
  brand: string;
  model: string;
  year: number;
  color: string;
  size: string;
  frameShape?: string;
  capacity?: string;
  variantId: string;
  quantity: number;
}

export interface PreorderEmailData {
  orderId: string;
  email: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  note?: string;
  season: string;
  items: PreorderEmailItem[];
}

function itemsTable(items: PreorderEmailItem[]): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:4px 12px 4px 0"><strong>${i.brand} ${i.model}</strong> (${i.year})</td>
        <td style="padding:4px 12px 4px 0">${[i.color, i.frameShape, i.capacity].filter(Boolean).join(' · ')}</td>
        <td style="padding:4px 12px 4px 0">${i.size}</td>
        <td style="padding:4px 12px 4px 0;color:#888">${i.variantId}</td>
        <td style="padding:4px 0;text-align:right"><strong>${i.quantity}×</strong></td>
      </tr>`
    )
    .join('');
  return `<table style="border-collapse:collapse;font-size:14px">
    <tr style="color:#888;text-align:left"><th style="padding-right:12px">Model</th><th style="padding-right:12px">Provedení</th><th style="padding-right:12px">Velikost</th><th style="padding-right:12px">NrLf</th><th>Ks</th></tr>
    ${rows}
  </table>`;
}

/** Internal notification that a dealer submitted a preorder. */
export async function sendPreorderNotifyToAdmin(d: PreorderEmailData): Promise<boolean> {
  if (!resend) {
    console.warn('[preorderEmail] RESEND_API_KEY not set — skipping admin notify');
    return false;
  }
  const total = d.items.reduce((s, i) => s + i.quantity, 0);
  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      subject: `${d.season} — nová předobjednávka: ${d.companyName || d.email} (${total} ks)`,
      html: `
        <p>Dealer odeslal předobjednávku (${d.season}):</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:2px 12px 2px 0;color:#888">Firma</td><td><strong>${d.companyName || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Kontakt</td><td><strong>${d.contactName || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">E-mail</td><td><strong>${d.email}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Telefon</td><td><strong>${d.phone || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Č. objednávky</td><td><strong>${d.orderId}</strong></td></tr>
        </table>
        ${itemsTable(d.items)}
        ${d.note ? `<p style="margin-top:12px"><span style="color:#888">Poznámka:</span> ${d.note}</p>` : ''}
        <p style="margin-top:16px"><a href="${ADMIN_URL}/admin/preorders"
          style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
          Otevřít v administraci</a></p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[preorderEmail] admin notify failed:', e);
    return false;
  }
}

/** Confirmation to the dealer that we received their preorder. */
export async function sendPreorderAck(d: PreorderEmailData): Promise<boolean> {
  if (!resend) {
    console.warn('[preorderEmail] RESEND_API_KEY not set — skipping ack');
    return false;
  }
  if (!d.email) return false;
  const greeting = d.contactName ? `Dobrý den ${d.contactName},` : 'Dobrý den,';
  try {
    await resend.emails.send({
      from: FROM,
      to: d.email,
      subject: `Přijali jsme vaši předobjednávku — ${d.season}`,
      html: `
        <p>${greeting}</p>
        <p>děkujeme — vaši předobjednávku (<strong>${d.season}</strong>) jsme přijali
        a&nbsp;budeme vás kontaktovat s&nbsp;potvrzením dostupnosti a&nbsp;cen.</p>
        ${itemsTable(d.items)}
        ${d.note ? `<p style="margin-top:12px"><span style="color:#888">Vaše poznámka:</span> ${d.note}</p>` : ''}
        <p style="margin-top:16px">S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Číslo předobjednávky: ${d.orderId}. Tento e-mail byl odeslán automaticky z biketime.cz.</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[preorderEmail] ack failed:', e);
    return false;
  }
}
