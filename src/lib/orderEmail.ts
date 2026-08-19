import 'server-only';
import { Resend } from 'resend';

// Objednávkové e-maily (Resend). Best-effort: výpadek e-mailu nesmí ztratit
// objednávku — ta je v okamžiku volání už uložená ve Firestore.

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL || 'Biketime <registrace@biketime.cz>';
const NOTIFY_TO = process.env.ORDER_NOTIFY_EMAIL || process.env.REGISTRATION_NOTIFY_EMAIL || 'info@biketime.cz';
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

const czk = (n: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);

export interface OrderEmailItem {
    brand: string;
    model: string;
    year: number;
    color: string;
    size: string;
    frameShape?: string;
    capacity?: string;
    variantId: string;
    quantity: number;
    /** VOC bez DPH za kus (null = cena bude potvrzena) */
    unitPriceCzk: number | null;
}

export interface OrderEmailData {
    orderId: string;
    email: string;
    companyName?: string;
    contactName?: string;
    phone?: string;
    priceLevel?: string;
    note?: string;
    items: OrderEmailItem[];
    totalCzk: number;
}

function itemsTable(items: OrderEmailItem[], totalCzk: number): string {
    const rows = items
        .map(
            (i) => `<tr>
        <td style="padding:4px 12px 4px 0"><strong>${esc(i.brand)} ${esc(i.model)}</strong> (${esc(i.year)})</td>
        <td style="padding:4px 12px 4px 0">${[i.color, i.frameShape, i.capacity].filter(Boolean).map(esc).join(' · ')}</td>
        <td style="padding:4px 12px 4px 0">${esc(i.size)}</td>
        <td style="padding:4px 12px 4px 0;color:#888">${esc(i.variantId)}</td>
        <td style="padding:4px 12px 4px 0;text-align:right">${i.unitPriceCzk != null ? czk(i.unitPriceCzk) : '—'}</td>
        <td style="padding:4px 0;text-align:right"><strong>${esc(i.quantity)}×</strong></td>
      </tr>`
        )
        .join('');
    return `<table style="border-collapse:collapse;font-size:14px">
    <tr style="color:#888;text-align:left"><th style="padding-right:12px">Model</th><th style="padding-right:12px">Provedení</th><th style="padding-right:12px">Velikost</th><th style="padding-right:12px">NrLf</th><th style="padding-right:12px;text-align:right">VOC/ks</th><th>Ks</th></tr>
    ${rows}
    <tr><td colspan="4"></td><td style="padding-top:8px;text-align:right;color:#888">Celkem bez DPH</td><td style="padding-top:8px;text-align:right"><strong>${czk(totalCzk)}</strong></td></tr>
  </table>`;
}

/** Interní notifikace o nové objednávce. */
export async function sendOrderNotifyToAdmin(d: OrderEmailData): Promise<boolean> {
    if (!resend) {
        console.warn('[orderEmail] RESEND_API_KEY not set — skipping admin notify');
        return false;
    }
    const total = d.items.reduce((s, i) => s + i.quantity, 0);
    try {
        await resend.emails.send({
            from: FROM,
            to: NOTIFY_TO,
            subject: `Nová objednávka: ${d.companyName || d.email} (${total} ks, ${czk(d.totalCzk)})`,
            html: `
        <p>Partner odeslal objednávku:</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:2px 12px 2px 0;color:#888">Firma</td><td><strong>${esc(d.companyName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Kontakt</td><td><strong>${esc(d.contactName) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">E-mail</td><td><strong>${esc(d.email)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Telefon</td><td><strong>${esc(d.phone) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Cenová skupina</td><td><strong>${esc(d.priceLevel) || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#888">Č. objednávky</td><td><strong>${esc(d.orderId)}</strong></td></tr>
        </table>
        ${itemsTable(d.items, d.totalCzk)}
        ${d.note ? `<p style="margin-top:12px"><span style="color:#888">Poznámka:</span> ${esc(d.note)}</p>` : ''}
        <p style="margin-top:16px"><a href="${ADMIN_URL}/admin/orders"
          style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">
          Otevřít v administraci</a></p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[orderEmail] admin notify failed:', e);
        return false;
    }
}

/** Potvrzení partnerovi, že jsme objednávku přijali. */
export async function sendOrderAck(d: OrderEmailData): Promise<boolean> {
    if (!resend) {
        console.warn('[orderEmail] RESEND_API_KEY not set — skipping ack');
        return false;
    }
    if (!d.email) return false;
    const greeting = d.contactName ? `Dobrý den ${esc(d.contactName)},` : 'Dobrý den,';
    try {
        await resend.emails.send({
            from: FROM,
            to: d.email,
            subject: 'Přijali jsme vaši objednávku — Biketime',
            html: `
        <p>${greeting}</p>
        <p>děkujeme za objednávku — přijali jsme ji a&nbsp;ozveme se
        s&nbsp;potvrzením dostupnosti a&nbsp;termínu dodání.</p>
        ${itemsTable(d.items, d.totalCzk)}
        ${d.note ? `<p style="margin-top:12px"><span style="color:#888">Vaše poznámka:</span> ${esc(d.note)}</p>` : ''}
        <p style="margin-top:16px">S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Číslo objednávky: ${esc(d.orderId)}. Tento e-mail byl odeslán automaticky z biketime.cz.</p>
      `,
        });
        return true;
    } catch (e) {
        console.error('[orderEmail] ack failed:', e);
        return false;
    }
}
