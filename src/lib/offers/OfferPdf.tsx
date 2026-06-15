import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { Offer, OfferItem } from '@/types/Offer';
import {
  eurToCzk,
  formatCzk,
  formatEur,
  formatDate,
  hasUniformPrice,
  sizePriceEur,
} from './format';

/** Pre-fetched image bytes for an item (keyed by item id). */
export type OfferImageMap = Record<string, { data: Buffer; format: 'png' | 'jpg' } | undefined>;

let fontsRegistered = false;

/**
 * Register Roboto (Unicode → renders Czech diacritics, which the built-in PDF
 * fonts cannot). Loaded over HTTP from the deployment's own /fonts directory so
 * it works in any serverless region. Safe to call repeatedly.
 */
export function registerOfferFonts(baseUrl: string): void {
  if (fontsRegistered) return;
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: `${baseUrl}/fonts/Roboto-Regular.ttf`, fontWeight: 'normal' },
      { src: `${baseUrl}/fonts/Roboto-Bold.ttf`, fontWeight: 'bold' },
    ],
  });
  // Roboto has no italic registered; avoid @react-pdf trying to synthesize one.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const RED = '#dc2626';
const ZINC900 = '#18181b';
const ZINC600 = '#52525b';
const ZINC400 = '#a1a1aa';
const ZINC200 = '#e4e4e7';
const ZINC100 = '#f4f4f5';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    color: ZINC900,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: ZINC900,
    paddingBottom: 12,
    marginBottom: 14,
  },
  brand: { fontSize: 18, fontWeight: 'bold', color: RED, letterSpacing: 1 },
  brandSub: { fontSize: 7.5, color: ZINC400, marginTop: 2 },
  title: { fontSize: 15, fontWeight: 'bold', marginTop: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { color: ZINC400, width: 58 },
  metaValue: { color: ZINC900 },
  metaValueStrong: { color: ZINC900, fontWeight: 'bold' },
  note: {
    backgroundColor: ZINC100,
    color: ZINC600,
    fontSize: 8,
    padding: 6,
    borderRadius: 4,
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: ZINC200,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    gap: 10,
  },
  imageBox: {
    width: 110,
    height: 82,
    backgroundColor: ZINC100,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: 104, height: 76, objectFit: 'contain' },
  noImage: { fontSize: 7, color: ZINC400 },
  details: { flex: 1 },
  brandLine: { fontSize: 7.5, fontWeight: 'bold', color: RED, letterSpacing: 0.5 },
  model: { fontSize: 12, fontWeight: 'bold' },
  color: { fontSize: 8.5, color: ZINC600, marginBottom: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2, marginBottom: 2 },
  chip: { fontSize: 7.5, color: ZINC600, backgroundColor: ZINC100, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  spec: { fontSize: 7.5, color: ZINC600, width: '50%', marginBottom: 1 },
  specLabel: { color: ZINC400 },
  code: { fontSize: 7, color: ZINC400, marginTop: 3 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  sizesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, flex: 1 },
  sizeChip: { fontSize: 8, color: ZINC900, borderWidth: 1, borderColor: ZINC200, backgroundColor: ZINC100, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  priceEur: { fontSize: 13, fontWeight: 'bold' },
  priceCzk: { fontSize: 9, color: ZINC600, textAlign: 'right' },
  sizeTable: { marginTop: 4 },
  sizeTableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: ZINC200, paddingBottom: 2 },
  sizeTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: ZINC100, paddingVertical: 2 },
  thSize: { width: '40%', fontSize: 7.5, color: ZINC400 },
  thNum: { width: '30%', fontSize: 7.5, color: ZINC400, textAlign: 'right' },
  tdSize: { width: '40%', fontSize: 9, fontWeight: 'bold' },
  tdEur: { width: '30%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  tdCzk: { width: '30%', fontSize: 9, color: ZINC600, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    textAlign: 'center',
    fontSize: 7,
    color: ZINC400,
  },
});

function ItemCard({ item, rate, image }: { item: OfferItem; rate: number; image?: OfferImageMap[string] }) {
  const uniform = hasUniformPrice(item);
  const specEntries = Object.entries(item.specs ?? {});

  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.imageBox}>
        {image ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, not HTML img
          <Image style={styles.image} src={image} />
        ) : (
          <Text style={styles.noImage}>bez foto</Text>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.brandLine}>
          {item.brand}
          {item.year ? `  ${item.year}` : ''}
        </Text>
        <Text style={styles.model}>{item.model}</Text>
        {item.color ? <Text style={styles.color}>{item.color}</Text> : null}

        {(item.motor || item.battery) && (
          <View style={styles.chipRow}>
            {item.motor ? <Text style={styles.chip}>{item.motor}</Text> : null}
            {item.battery ? <Text style={styles.chip}>{item.battery}</Text> : null}
          </View>
        )}

        {specEntries.length > 0 && (
          <View style={styles.specRow}>
            {specEntries.map(([label, value]) => (
              <Text key={label} style={styles.spec}>
                <Text style={styles.specLabel}>{label}: </Text>
                {value}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.code}>NRLF: {item.nrLf}</Text>

        {uniform ? (
          <View style={styles.priceRow}>
            <View style={styles.sizesWrap}>
              {item.sizes.map((s, i) => (
                <Text key={`${s.size}-${i}`} style={styles.sizeChip}>
                  {s.size}
                  {s.quantity ? ` · ${s.quantity} ks` : ''}
                </Text>
              ))}
            </View>
            <View>
              <Text style={styles.priceEur}>{formatEur(item.priceEur)}</Text>
              <Text style={styles.priceCzk}>{formatCzk(eurToCzk(item.priceEur, rate))}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.sizeTable}>
            <View style={styles.sizeTableHead}>
              <Text style={styles.thSize}>Velikost</Text>
              <Text style={styles.thNum}>Cena (EUR)</Text>
              <Text style={styles.thNum}>Cena (CZK)</Text>
            </View>
            {item.sizes.map((s, i) => {
              const eur = sizePriceEur(item, s);
              return (
                <View key={`${s.size}-${i}`} style={styles.sizeTableRow}>
                  <Text style={styles.tdSize}>
                    {s.size}
                    {s.quantity ? ` · ${s.quantity} ks` : ''}
                  </Text>
                  <Text style={styles.tdEur}>{formatEur(eur)}</Text>
                  <Text style={styles.tdCzk}>{formatCzk(eurToCzk(eur, rate))}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function OfferDocument({ offer, images }: { offer: Offer; images: OfferImageMap }) {
  const rate = offer.eurToCzk || 25;
  const validUntil = formatDate(offer.validUntil);

  return (
    <Document title={offer.title ?? 'Cenová nabídka'} author="Biketime">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>BIKETIME</Text>
            <Text style={styles.brandSub}>Oficiální distribuce kol BULLS</Text>
            <Text style={styles.title}>{offer.title ?? 'Cenová nabídka'}</Text>
          </View>
          <View>
            {offer.client.company ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Pro:</Text>
                <Text style={styles.metaValueStrong}>{offer.client.company}</Text>
              </View>
            ) : null}
            {offer.client.contactName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Kontakt:</Text>
                <Text style={styles.metaValue}>{offer.client.contactName}</Text>
              </View>
            ) : null}
            {offer.client.email ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>E-mail:</Text>
                <Text style={styles.metaValue}>{offer.client.email}</Text>
              </View>
            ) : null}
            {validUntil ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Platnost do:</Text>
                <Text style={styles.metaValueStrong}>{validUntil}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.note}>
          Všechny ceny jsou nákupní, bez DPH. Přepočet z EUR kurzem 1 EUR = {rate} CZK.
        </Text>

        {offer.items.map((item) => (
          <ItemCard key={item.id} item={item} rate={rate} image={images[item.id]} />
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Nabídka vygenerována na biketime.cz · Ceny bez DPH · Nezávazná cenová nabídka · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/** Render the offer to a PDF buffer. Fonts must be registered first. */
export function renderOfferPdf(offer: Offer, images: OfferImageMap): Promise<Buffer> {
  return renderToBuffer(<OfferDocument offer={offer} images={images} />);
}
