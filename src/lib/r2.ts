import 'server-only';
import { AwsClient } from 'aws4fetch';

// Cloudflare R2 (S3 API) — média reklamací. Privátní bucket; prohlížeč
// nahrává přímo přes presigned PUT (Vercel limit ~4,5 MB na body by videa
// nepustil) a čte přes krátkodobé presigned GET. Credentials jen na serveru.

export const CLAIM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;
export const CLAIM_VIDEO_TYPES = ['video/mp4', 'video/quicktime'] as const;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_CLAIM_FILES = 6;

const EXT_FOR_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
};

export function isAllowedClaimType(contentType: string): boolean {
    return contentType in EXT_FOR_TYPE;
}

export function maxBytesForType(contentType: string): number {
    return (CLAIM_VIDEO_TYPES as readonly string[]).includes(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

/** Přípona odvozená VÝHRADNĚ z content-type — názvu souboru od klienta nevěříme. */
export function extForContentType(contentType: string): string | null {
    return EXT_FOR_TYPE[contentType] || null;
}

let client: AwsClient | null = null;

function r2Client(): AwsClient {
    if (!client) {
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
            throw new Error('R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY not set');
        }
        client = new AwsClient({ accessKeyId, secretAccessKey, region: 'auto', service: 's3' });
    }
    return client;
}

function objectUrl(key: string): URL {
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET;
    if (!accountId || !bucket) throw new Error('R2_ACCOUNT_ID / R2_BUCKET not set');
    // Klíče generujeme sami (uid/uuid/přípona) — segmenty jsou URL-safe.
    return new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`);
}

/** Presigned PUT pro přímý upload z prohlížeče; content-type je součástí podpisu. */
export async function presignPutUrl(key: string, contentType: string, expiresSeconds = 600): Promise<string> {
    const url = objectUrl(key);
    url.searchParams.set('X-Amz-Expires', String(expiresSeconds));
    const signed = await r2Client().sign(
        new Request(url, { method: 'PUT', headers: { 'content-type': contentType } }),
        { aws: { signQuery: true } },
    );
    return signed.url;
}

/** Presigned GET pro zobrazení média (zóna partnera i administrace). */
export async function presignGetUrl(key: string, expiresSeconds = 900): Promise<string> {
    const url = objectUrl(key);
    url.searchParams.set('X-Amz-Expires', String(expiresSeconds));
    const signed = await r2Client().sign(new Request(url), { aws: { signQuery: true } });
    return signed.url;
}
