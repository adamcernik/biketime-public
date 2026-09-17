import { FeedItem, FeedPriceLevel } from './mapProduct';

// Serializace feedu do XML / CSV / JSON. Vstupem jsou už hotové FeedItem
// (allowlist v mapProduct.ts) — tady se nic nefiltruje, jen formátuje.

export type FeedFormat = 'xml' | 'csv' | 'json' | 'heureka';

export const FEED_CONTENT_TYPES: Record<FeedFormat, string> = {
    xml: 'application/xml; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
    json: 'application/json; charset=utf-8',
    heureka: 'application/xml; charset=utf-8',
};

export interface FeedMeta {
    level: FeedPriceLevel;
    generatedAt: string;
}

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** <tag>hodnota</tag>, nebo prázdný řetězec pro null/undefined. */
function el(tag: string, value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    return `<${tag}>${xmlEscape(String(value))}</${tag}>`;
}

export function feedToXml(items: FeedItem[], meta: FeedMeta): string {
    const rows = items.map((i) => [
        '  <item>',
        `    ${el('item_id', i.itemId)}${el('product_id', i.productId)}${el('ean', i.ean)}`,
        `    ${el('brand', i.brand)}${el('model', i.model)}${el('name', i.name)}${el('year', i.year || '')}`,
        `    ${el('category', i.category)}${el('ebike', i.isEbike ? 1 : 0)}`,
        `    ${el('color', i.color)}${el('size', i.size)}${el('battery_wh', i.capacity)}`,
        `    ${el('url', i.url)}`,
        `    <images>${i.images.map((img) => el('image', img)).join('')}</images>`,
        `    ${el('price_moc_czk_vat', i.mocCzkVat)}${el('price_voc_czk', i.vocCzk)}`,
        `    ${el('availability', i.availability)}${el('availability_text', i.availabilityText)}`,
        `    <params>${Object.entries(i.params).map(([k, v]) => `<param>${el('name', k)}${el('value', v)}</param>`).join('')}</params>`,
        '  </item>',
    ].join('\n')).join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<biketime_feed generated="${xmlEscape(meta.generatedAt)}" price_level="${meta.level}" currency="CZK" item_count="${items.length}">`,
        rows,
        '</biketime_feed>',
        '',
    ].join('\n');
}

const CSV_COLUMNS = [
    'item_id', 'product_id', 'ean', 'brand', 'model', 'name', 'year', 'category', 'ebike',
    'color', 'size', 'battery_wh', 'price_moc_czk_vat', 'price_voc_czk',
    'availability', 'availability_text', 'url', 'image', 'images',
] as const;

function csvCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV se středníkem a BOM — otevře se správně i v českém Excelu. */
export function feedToCsv(items: FeedItem[]): string {
    const lines = [CSV_COLUMNS.join(';')];
    for (const i of items) {
        lines.push([
            i.itemId, i.productId, i.ean, i.brand, i.model, i.name, i.year || '', i.category,
            i.isEbike ? 1 : 0, i.color, i.size, i.capacity, i.mocCzkVat, i.vocCzk,
            i.availability, i.availabilityText, i.url, i.images[0], i.images.join('|'),
        ].map(csvCell).join(';'));
    }
    return '﻿' + lines.join('\r\n') + '\r\n';
}

export function feedToJson(items: FeedItem[], meta: FeedMeta): string {
    return JSON.stringify({
        generated: meta.generatedAt,
        priceLevel: meta.level,
        currency: 'CZK',
        itemCount: items.length,
        items,
    });
}

// Heureka XML dialekt — strukturu <SHOP><SHOPITEM> umí řada českých e-shopů
// (vč. Shoptetu) importovat rovnou bez mapování. Cena = MOC s DPH (feed pro
// maloobchodní výdej partnera); jeho VOC tu záměrně NENÍ — pro nákupku slouží
// generické formáty. Neprodejné položky (availability none) se vynechávají.

/** Dostupnost → DELIVERY_DATE (dny do expedice dle Heureka specifikace). */
const HEUREKA_DELIVERY: Partial<Record<FeedItem['availability'], number>> = {
    'ours': 0,
    'zeg-stock': 7,
    'zeg-low': 7,
    'zeg-date': 30,
    'on-order': 30,
};

export function feedToHeureka(items: FeedItem[]): string {
    const rows: string[] = [];
    for (const i of items) {
        const delivery = HEUREKA_DELIVERY[i.availability];
        if (delivery === undefined || i.mocCzkVat == null) continue; // neprodejné / bez ceny

        const categoryText = i.isEbike
            ? 'Heureka.cz | Sport | Cyklistika | Elektrokola'
            : 'Heureka.cz | Sport | Cyklistika | Jízdní kola';
        const params = [
            i.size && `<PARAM><PARAM_NAME>Velikost rámu</PARAM_NAME><VAL>${xmlEscape(i.size)}</VAL></PARAM>`,
            i.color && `<PARAM><PARAM_NAME>Barva</PARAM_NAME><VAL>${xmlEscape(i.color)}</VAL></PARAM>`,
            i.capacity && `<PARAM><PARAM_NAME>Kapacita baterie</PARAM_NAME><VAL>${xmlEscape(i.capacity)} Wh</VAL></PARAM>`,
        ].filter(Boolean).join('');

        rows.push([
            '  <SHOPITEM>',
            `    ${el('ITEM_ID', i.itemId)}${el('ITEMGROUP_ID', i.productId)}${el('PRODUCTNO', i.itemId)}${el('EAN', i.ean)}`,
            `    ${el('PRODUCTNAME', i.name)}${el('MANUFACTURER', i.brand)}`,
            `    ${el('CATEGORYTEXT', categoryText)}`,
            `    ${el('URL', i.url)}`,
            `    ${el('IMGURL', i.images[0])}${i.images.slice(1).map((img) => el('IMGURL_ALTERNATIVE', img)).join('')}`,
            `    ${el('PRICE_VAT', i.mocCzkVat)}${el('DELIVERY_DATE', delivery)}`,
            `    ${params}`,
            '  </SHOPITEM>',
        ].join('\n'));
    }

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<SHOP xmlns="http://www.heureka.cz/ns/offer/1.0">`,
        rows.join('\n'),
        '</SHOP>',
        '',
    ].join('\n');
}

export function serializeFeed(format: FeedFormat, items: FeedItem[], meta: FeedMeta): string {
    if (format === 'csv') return feedToCsv(items);
    if (format === 'json') return feedToJson(items, meta);
    if (format === 'heureka') return feedToHeureka(items);
    return feedToXml(items, meta);
}
