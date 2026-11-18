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
    /** 'top-akce' = objednávka z akční nabídky (jiný předmět a text potvrzení). */
    source?: string;
}

const isTopAkce = (d: OrderEmailData) => d.source === 'top-akce';

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
            subject: `${isTopAkce(d) ? 'Nová objednávka TOP AKCE' : 'Nová objednávka'}: ${d.companyName || d.email} (${total} ks, ${czk(d.totalCzk)})`,
            html: `
        <p>Partner odeslal objednávku${isTopAkce(d) ? ' <strong>z akční nabídky TOP AKCE</strong> (čeká na potvrzení)' : ''}:</p>
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
            subject: isTopAkce(d) ? 'Přijali jsme vaši objednávku z TOP AKCE — Biketime' : 'Přijali jsme vaši objednávku — Biketime',
            html: `
        <p>${greeting}</p>
        ${isTopAkce(d)
            ? `<p>děkujeme za objednávku z&nbsp;akční nabídky TOP AKCE. Objednávka je zatím
        <strong>nezávazná</strong> — kola jsou ve skladu výrobce, dostupnost ověříme
        a&nbsp;objednávku vám následně potvrdíme včetně termínu dodání.</p>`
            : `<p>děkujeme za objednávku — přijali jsme ji a&nbsp;ozveme se
        s&nbsp;potvrzením dostupnosti a&nbsp;termínu dodání.</p>`}
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

/* ───────────────── potvrzení objednávky s reálnými kusy ───────────────── */

export interface ConfirmedOrderLine extends OrderEmailItem {
    /** Kusy potvrzené adminem; 0 = nedodáme. */
    confirmedQty?: number | null;
}

/** Objednávka tak, jak leží v `orders/{id}` po potvrzení v administraci. */
export interface ConfirmedOrderDoc {
    id: string;
    email: string;
    status?: string;
    source?: string;
    customer?: { companyName?: string; contactName?: string };
    items: ConfirmedOrderLine[];
    totalCzk?: number;
    confirmedAt?: string | null;
    confirmedItemCount?: number;
    confirmedTotalCzk?: number;
    /** Zpráva partnerovi od Biketime (termín dodání apod.). */
    confirmNote?: string;
}

function confirmationTable(items: ConfirmedOrderLine[], confirmedTotalCzk: number): string {
    const rows = items
        .map((i) => {
            const ordered = Number(i.quantity) || 0;
            const confirmed = Math.max(0, Number(i.confirmedQty ?? ordered) || 0);
            const short = confirmed < ordered;
            const rowStyle = confirmed === 0 ? 'color:#999' : '';
            const confirmedCell = confirmed === 0
                ? '<span style="color:#c0392b;font-weight:bold">nedodáme</span>'
                : `<strong style="${short ? 'color:#c0392b' : ''}">${confirmed}×</strong>`;
            return `<tr style="${rowStyle}">
        <td style="padding:4px 12px 4px 0"><strong>${esc(i.brand)} ${esc(i.model)}</strong>${i.year ? ` (${esc(i.year)})` : ''}</td>
        <td style="padding:4px 12px 4px 0">${[i.color, i.frameShape, i.capacity].filter(Boolean).map(esc).join(' · ')}</td>
        <td style="padding:4px 12px 4px 0">${esc(i.size)}</td>
        <td style="padding:4px 12px 4px 0;color:#888">${esc(i.variantId)}</td>
        <td style="padding:4px 12px 4px 0;text-align:right">${i.unitPriceCzk != null ? czk(i.unitPriceCzk) : '—'}</td>
        <td style="padding:4px 12px 4px 0;text-align:right;color:#888">${ordered}×</td>
        <td style="padding:4px 0;text-align:right">${confirmedCell}</td>
      </tr>`;
        })
        .join('');
    return `<table style="border-collapse:collapse;font-size:14px">
    <tr style="color:#888;text-align:left"><th style="padding-right:12px">Model</th><th style="padding-right:12px">Provedení</th><th style="padding-right:12px">Velikost</th><th style="padding-right:12px">NrLf</th><th style="padding-right:12px;text-align:right">VOC/ks</th><th style="padding-right:12px;text-align:right">Objednáno</th><th style="text-align:right">Potvrzeno</th></tr>
    ${rows}
    <tr><td colspan="5"></td><td style="padding-top:8px;text-align:right;color:#888">Celkem bez DPH</td><td style="padding-top:8px;text-align:right"><strong>${czk(confirmedTotalCzk)}</strong></td></tr>
  </table>`;
}

/**
 * Potvrzení objednávky partnerovi s reálnými kusy, které dodáme. Kopie jde
 * na interní adresu (NOTIFY_TO). Vrací chybu jako text — volající ji uloží
 * k objednávce a admin může e-mail poslat znovu.
 */
export async function sendOrderConfirmation(o: ConfirmedOrderDoc): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!resend) return { ok: false, error: 'RESEND_API_KEY není nastaven' };
    if (!o.email) return { ok: false, error: 'Objednávka nemá e-mail' };

    const items = Array.isArray(o.items) ? o.items : [];
    const orderedQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const confirmedQty = o.confirmedItemCount ?? items.reduce((s, i) => s + Math.max(0, Number(i.confirmedQty ?? i.quantity) || 0), 0);
    const confirmedTotal = o.confirmedTotalCzk
        ?? items.reduce((s, i) => s + (i.unitPriceCzk ?? 0) * Math.max(0, Number(i.confirmedQty ?? i.quantity) || 0), 0);
    const nothing = confirmedQty === 0;
    const differs = confirmedQty !== orderedQty;
    const topAkce = o.source === 'top-akce';
    const greeting = o.customer?.contactName ? `Dobrý den ${esc(o.customer.contactName)},` : 'Dobrý den,';

    const intro = nothing
        ? `<p>bohužel vám musíme oznámit, že objednávku <strong>${esc(o.id)}</strong>${topAkce ? ' z&nbsp;akční nabídky TOP AKCE' : ''}
       nemůžeme vyřídit — objednaná kola se u&nbsp;výrobce mezitím prodala. Omlouváme se.</p>`
        : differs
            ? `<p>potvrzujeme vaši objednávku <strong>${esc(o.id)}</strong>${topAkce ? ' z&nbsp;akční nabídky TOP AKCE' : ''}.
       U&nbsp;některých položek jsme bohužel nemohli potvrdit plný počet — kola se u&nbsp;výrobce mezitím prodala.
       Dodáme kusy ve sloupci <strong>Potvrzeno</strong>; položky označené „nedodáme“ z&nbsp;objednávky vypadávají.</p>`
            : `<p>potvrzujeme vaši objednávku <strong>${esc(o.id)}</strong>${topAkce ? ' z&nbsp;akční nabídky TOP AKCE' : ''}
       v&nbsp;plném rozsahu.</p>`;

    const subject = nothing
        ? `Objednávku ${o.id} bohužel nemůžeme vyřídit — Biketime`
        : differs
            ? `Potvrzení objednávky ${o.id} (upravené počty) — Biketime`
            : `Potvrzení objednávky ${o.id} — Biketime`;

    try {
        await resend.emails.send({
            from: FROM,
            to: o.email,
            bcc: NOTIFY_TO,
            replyTo: NOTIFY_TO,
            subject,
            html: `
        <p>${greeting}</p>
        ${intro}
        ${confirmationTable(items, confirmedTotal)}
        ${!nothing ? `<p style="margin-top:12px;color:#555;font-size:13px">Fakturovat budeme jen potvrzené kusy (ceny VOC bez DPH).</p>` : ''}
        ${o.confirmNote ? `<p style="margin-top:12px"><span style="color:#888">Zpráva od Biketime:</span><br/>${esc(o.confirmNote).replace(/\n/g, '<br/>')}</p>` : ''}
        <p style="margin-top:16px">S pozdravem,<br/>tým Biketime</p>
        <hr/>
        <p style="color:#888;font-size:12px">Číslo objednávky: ${esc(o.id)}. Odpovědí na tento e-mail se dostanete na ${esc(NOTIFY_TO)}.</p>
      `,
        });
        return { ok: true };
    } catch (e) {
        console.error('[orderEmail] confirmation failed:', e);
        return { ok: false, error: e instanceof Error ? e.message : 'Odeslání selhalo' };
    }
}
