import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    renderToBuffer,
} from '@react-pdf/renderer';
import type { CenikData, CenikRow } from './buildCenik';
import { AVAILABILITY_LABELS, type VariantAvailabilityState } from '@/lib/availability';

// PDF ceníku — kompaktní tabulka, volitelně s miniaturami. Fonty registruje
// volající přes registerOfferFonts() (sdílené Roboto z /fonts).

export type CenikImageMap = Record<string, { data: Buffer; format: 'png' | 'jpg' } | undefined>;

const RED = '#dc2626';
const ZINC900 = '#18181b';
const ZINC600 = '#52525b';
const ZINC400 = '#a1a1aa';
const ZINC200 = '#e4e4e7';
const ZINC100 = '#f4f4f5';
const GREEN = '#16a34a';
const AMBER = '#d97706';
const SKY = '#0284c7';

const AVAILABILITY_COLORS: Record<VariantAvailabilityState, string> = {
    'ours': GREEN,
    'zeg-stock': GREEN,
    'zeg-low': AMBER,
    'zeg-date': SKY,
    'on-order': ZINC600,
    'none': ZINC400,
};

const czk = (n: number) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(n)} Kč`;

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Roboto',
        fontSize: 8,
        color: ZINC900,
        paddingTop: 28,
        paddingBottom: 36,
        paddingHorizontal: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: ZINC900,
        paddingBottom: 10,
        marginBottom: 10,
    },
    brand: { fontSize: 16, fontWeight: 'bold', color: RED, letterSpacing: 1 },
    brandSub: { fontSize: 7, color: ZINC400, marginTop: 2 },
    title: { fontSize: 13, fontWeight: 'bold', marginTop: 8 },
    metaRow: { flexDirection: 'row', marginBottom: 2 },
    metaLabel: { color: ZINC400, width: 72 },
    metaValue: { color: ZINC900 },
    metaValueStrong: { color: ZINC900, fontWeight: 'bold' },
    note: {
        backgroundColor: ZINC100,
        color: ZINC600,
        fontSize: 7,
        padding: 5,
        borderRadius: 4,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 4,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: ZINC200,
    },
    headRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: ZINC200,
        paddingVertical: 2,
        color: ZINC400,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: ZINC100,
        paddingVertical: 3,
        alignItems: 'center',
    },
    imgBox: { width: 44, height: 30, backgroundColor: ZINC100, borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    img: { width: 42, height: 28, objectFit: 'contain' },
    colModel: { flex: 1 },
    model: { fontWeight: 'bold', fontSize: 8.5 },
    variant: { color: ZINC600, fontSize: 7 },
    colSizes: { width: 88, fontSize: 7, color: ZINC600 },
    colAvail: { width: 66, fontSize: 7 },
    colMoc: { width: 58, textAlign: 'right', color: ZINC600 },
    colVoc: { width: 62, textAlign: 'right', fontWeight: 'bold' },
    footer: {
        position: 'absolute',
        bottom: 14,
        left: 28,
        right: 28,
        textAlign: 'center',
        fontSize: 6.5,
        color: ZINC400,
    },
});

function RowView({ row, withImages, image }: { row: CenikRow; withImages: boolean; image?: CenikImageMap[string] }) {
    return (
        <View style={styles.row} wrap={false}>
            {withImages && (
                <View style={styles.imgBox}>
                    {image ? (
                        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image
                        <Image style={styles.img} src={image} />
                    ) : (
                        <Text style={{ fontSize: 5, color: ZINC400 }}>bez foto</Text>
                    )}
                </View>
            )}
            <View style={styles.colModel}>
                <Text style={styles.model}>{row.model} ({row.year})</Text>
                <Text style={styles.variant}>
                    {[row.color, row.capacity ? (row.capacity.toLowerCase().includes('wh') ? row.capacity : `${row.capacity} Wh`) : ''].filter(Boolean).join(' · ')}
                </Text>
            </View>
            <Text style={styles.colSizes}>{row.sizes.map((s) => s.size).join(', ')}</Text>
            <Text style={[styles.colAvail, { color: AVAILABILITY_COLORS[row.availability] }]}>
                {AVAILABILITY_LABELS[row.availability]}
            </Text>
            <Text style={styles.colMoc}>{row.moc != null ? czk(row.moc) : '—'}</Text>
            <Text style={styles.colVoc}>{row.voc != null ? czk(row.voc) : '—'}</Text>
        </View>
    );
}

function CenikDocument({ data, rows, companyName, withImages, images }: {
    data: CenikData;
    rows: CenikRow[];
    companyName?: string;
    withImages: boolean;
    images: CenikImageMap;
}) {
    const date = new Date(data.generatedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

    // Sekce podle kategorie (řádky už přicházejí seřazené)
    const sections: { category: string; rows: CenikRow[] }[] = [];
    for (const row of rows) {
        const last = sections[sections.length - 1];
        if (last && last.category === row.category) last.rows.push(row);
        else sections.push({ category: row.category || 'Ostatní', rows: [row] });
    }

    return (
        <Document title="Dealerský ceník Biketime" author="Biketime">
            <Page size="A4" style={styles.page}>
                <View style={styles.header} fixed>
                    <View>
                        <Text style={styles.brand}>BIKETIME</Text>
                        <Text style={styles.brandSub}>Oficiální distribuce kol BULLS</Text>
                        <Text style={styles.title}>Dealerský ceník</Text>
                    </View>
                    <View>
                        {companyName ? (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Pro:</Text>
                                <Text style={styles.metaValueStrong}>{companyName}</Text>
                            </View>
                        ) : null}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Cenová hladina:</Text>
                            <Text style={styles.metaValueStrong}>{data.level}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Vygenerováno:</Text>
                            <Text style={styles.metaValue}>{date}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Položek:</Text>
                            <Text style={styles.metaValue}>{rows.length}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.note}>
                    VOC = velkoobchodní cena bez DPH pro hladinu {data.level}. MOC = doporučená maloobchodní cena s DPH.
                    Ceny a dostupnost se mohou měnit — závazné potvrzení proběhne při objednávce.
                </Text>

                {sections.map((section) => (
                    <View key={section.category}>
                        <Text style={styles.sectionTitle}>{section.category}</Text>
                        <View style={styles.headRow}>
                            {withImages && <Text style={{ width: 50 }}> </Text>}
                            <Text style={styles.colModel}>Model / provedení</Text>
                            <Text style={styles.colSizes}>Velikosti</Text>
                            <Text style={styles.colAvail}>Dostupnost</Text>
                            <Text style={styles.colMoc}>MOC s DPH</Text>
                            <Text style={styles.colVoc}>VOC bez DPH</Text>
                        </View>
                        {section.rows.map((row) => (
                            <RowView key={row.key} row={row} withImages={withImages} image={images[row.key]} />
                        ))}
                    </View>
                ))}

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `Dealerský ceník Biketime · hladina ${data.level} · ${date} · Ceny VOC bez DPH · ${pageNumber}/${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
}

export function renderCenikPdf(
    data: CenikData,
    rows: CenikRow[],
    companyName: string | undefined,
    withImages: boolean,
    images: CenikImageMap,
): Promise<Buffer> {
    return renderToBuffer(
        <CenikDocument data={data} rows={rows} companyName={companyName} withImages={withImages} images={images} />,
    );
}
