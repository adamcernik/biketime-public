'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet } from '@/lib/clientApi';
import { track } from '@/lib/analytics';

// Reklamace / servisní případy partnera: seznam vlastních případů +
// formulář nové reklamace. Přílohy jdou přímo do R2 přes presigned PUT
// (videa by neprošla API routou), server dostane jen klíče.

interface ClaimMedia {
    key: string;
    fileName: string;
    contentType: string;
    size: number;
}

interface Claim {
    id: string;
    status: string;
    createdAt: string;
    frameNumber: string;
    description: string;
    adminNote?: string;
    media: ClaimMedia[];
}

interface MediaUrl {
    key: string;
    fileName: string;
    contentType: string;
    url: string;
}

const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
    new: { label: 'Nová', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_progress: { label: 'V řešení', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    resolved: { label: 'Vyřízeno', cls: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Zamítnuto', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,.heic,.mov';
const MAX_FILES = 6;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const TYPE_FOR_EXT: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    heic: 'image/heic', mp4: 'video/mp4', mov: 'video/quicktime',
};

function isAllowed(contentType: string): boolean {
    return Object.values(TYPE_FOR_EXT).includes(contentType);
}

/** Safari/Windows občas nedodá file.type (hlavně HEIC/MOV) — dopočítáme z přípony. */
function contentTypeForFile(file: File): string | null {
    if (isAllowed(file.type)) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return TYPE_FOR_EXT[ext] || null;
}

const fmtMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface UploadItem {
    localId: string;
    fileName: string;
    contentType: string;
    size: number;
    previewUrl?: string;
    progress: number;
    status: 'uploading' | 'done' | 'error';
    key?: string;
    error?: string;
    xhr?: XMLHttpRequest;
}

/** PUT do R2 přes XHR kvůli progress událostem (fetch upload progress neumí). */
function putToR2(url: string, file: File, contentType: string, onProgress: (pct: number) => void, register: (xhr: XMLHttpRequest) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        register(xhr);
        xhr.open('PUT', url);
        xhr.setRequestHeader('content-type', contentType);
        xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('R2 upload network error'));
        xhr.onabort = () => reject(new Error('aborted'));
        xhr.send(file);
    });
}

function ClaimForm({ onCreated }: { onCreated: () => void }) {
    const [frameNumber, setFrameNumber] = useState('');
    const [description, setDescription] = useState('');
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const draftIdRef = useRef<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    if (!draftIdRef.current && typeof crypto !== 'undefined') draftIdRef.current = crypto.randomUUID();

    const patchUpload = (localId: string, patch: Partial<UploadItem>) =>
        setUploads(prev => prev.map(u => (u.localId === localId ? { ...u, ...patch } : u)));

    const handleFiles = (list: FileList | null) => {
        if (!list) return;
        setError('');
        const files = Array.from(list);
        if (fileInputRef.current) fileInputRef.current.value = '';

        let count = uploads.filter(u => u.status !== 'error').length;
        for (const file of files) {
            if (count >= MAX_FILES) {
                setError(`Příloh může být nejvýše ${MAX_FILES}.`);
                break;
            }
            const contentType = contentTypeForFile(file);
            if (!contentType || !isAllowed(contentType)) {
                setError(`${file.name}: nepodporovaný typ. Nahrajte fotku (JPG, PNG, WebP, HEIC) nebo video (MP4, MOV).`);
                continue;
            }
            const limit = contentType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
            if (file.size > limit) {
                setError(`${file.name}: soubor je příliš velký (limit ${Math.round(limit / 1024 / 1024)} MB).`);
                continue;
            }

            count++;
            const localId = crypto.randomUUID();
            const item: UploadItem = {
                localId,
                fileName: file.name,
                contentType,
                size: file.size,
                previewUrl: contentType.startsWith('image/') && contentType !== 'image/heic' ? URL.createObjectURL(file) : undefined,
                progress: 0,
                status: 'uploading',
            };
            setUploads(prev => [...prev, item]);

            (async () => {
                try {
                    const res = await apiGet('/api/claims/upload-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ draftId: draftIdRef.current, fileName: file.name, contentType, size: file.size }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data.url) throw new Error(data.error || 'Nahrávání se nepodařilo připravit.');
                    await putToR2(data.url, file, contentType, pct => patchUpload(localId, { progress: pct }), xhr => patchUpload(localId, { xhr }));
                    patchUpload(localId, { status: 'done', progress: 100, key: data.key, xhr: undefined });
                } catch (e) {
                    patchUpload(localId, {
                        status: 'error',
                        xhr: undefined,
                        error: e instanceof Error && e.message !== 'aborted' ? e.message : 'Nahrávání selhalo.',
                    });
                }
            })();
        }
    };

    const removeUpload = (item: UploadItem) => {
        item.xhr?.abort();
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setUploads(prev => prev.filter(u => u.localId !== item.localId));
    };

    const uploading = uploads.some(u => u.status === 'uploading');
    const failed = uploads.filter(u => u.status === 'error');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!frameNumber.trim()) { setError('Vyplňte rámové číslo nebo BikeID.'); return; }
        if (!description.trim()) { setError('Popište prosím závadu.'); return; }
        if (uploading) { setError('Počkejte prosím na dokončení nahrávání příloh.'); return; }
        if (failed.length > 0) { setError('Některé přílohy se nepodařilo nahrát — odeberte je, nebo je zkuste nahrát znovu.'); return; }

        setSubmitting(true);
        try {
            const media = uploads
                .filter(u => u.status === 'done' && u.key)
                .map(u => ({ key: u.key, fileName: u.fileName, contentType: u.contentType, size: u.size }));
            const res = await apiGet('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frameNumber: frameNumber.trim(), description: description.trim(), media }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Reklamaci se nepodařilo odeslat.');

            track('claim_submitted', {
                media_count: media.length,
                has_video: media.some(m => m.contentType?.startsWith('video/')),
            });
            uploads.forEach(u => { if (u.previewUrl) URL.revokeObjectURL(u.previewUrl); });
            setFrameNumber('');
            setDescription('');
            setUploads([]);
            draftIdRef.current = crypto.randomUUID();
            onCreated();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Reklamaci se nepodařilo odeslat.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = 'w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent';

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-6">
            <h2 className="font-bold text-zinc-900 mb-4">Nová reklamace</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="claim-frame">
                        Rámové číslo nebo BikeID *
                    </label>
                    <input
                        id="claim-frame"
                        type="text"
                        value={frameNumber}
                        onChange={e => setFrameNumber(e.target.value)}
                        maxLength={100}
                        placeholder="např. WBK123456789 nebo BikeID"
                        className={inputCls}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="claim-desc">
                        Popis závady *
                    </label>
                    <textarea
                        id="claim-desc"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={5000}
                        rows={5}
                        placeholder="Popište co nejpřesněji, co a za jakých okolností se projevuje…"
                        className={inputCls}
                    />
                </div>

                <div>
                    <span className="block text-sm font-medium text-zinc-700 mb-1">
                        Fotky a videa <span className="font-normal text-zinc-400">(max {MAX_FILES} souborů; fotky do 15 MB, videa do 200 MB)</span>
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPT}
                        onChange={e => handleFiles(e.target.files)}
                        className="block w-full text-sm text-zinc-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:text-zinc-700 file:font-medium hover:file:bg-zinc-200 file:cursor-pointer"
                    />

                    {uploads.length > 0 && (
                        <ul className="mt-3 space-y-2">
                            {uploads.map(u => (
                                <li key={u.localId} className="flex items-center gap-3 border border-zinc-100 rounded-xl p-2">
                                    {u.previewUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={u.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-zinc-800 truncate">{u.fileName}</div>
                                        <div className="text-xs text-zinc-400">
                                            {fmtMb(u.size)}
                                            {u.status === 'uploading' && ` · nahrávám ${u.progress} %`}
                                            {u.status === 'done' && ' · nahráno'}
                                            {u.status === 'error' && <span className="text-red-600"> · {u.error || 'chyba'}</span>}
                                        </div>
                                        {u.status === 'uploading' && (
                                            <div className="mt-1 h-1 rounded bg-zinc-100 overflow-hidden">
                                                <div className="h-full bg-zinc-900 transition-all" style={{ width: `${u.progress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeUpload(u)}
                                        className="text-zinc-400 hover:text-red-600 p-1 shrink-0"
                                        aria-label={`Odebrat ${u.fileName}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {error && <div className="text-red-700 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}

                <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="bg-zinc-900 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Odesílám…' : uploading ? 'Nahrávají se přílohy…' : 'Odeslat reklamaci'}
                </button>
            </div>
        </form>
    );
}

function ClaimList({ claims, fetching }: { claims: Claim[]; fetching: boolean }) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [mediaUrls, setMediaUrls] = useState<Record<string, MediaUrl[] | 'loading' | 'error'>>({});

    const toggle = (claim: Claim) => {
        const open = expanded === claim.id;
        setExpanded(open ? null : claim.id);
        if (!open && claim.media?.length > 0 && !mediaUrls[claim.id]) {
            setMediaUrls(prev => ({ ...prev, [claim.id]: 'loading' }));
            apiGet(`/api/claims/${claim.id}/media`, { cache: 'no-store' })
                .then(r => r.json())
                .then(data => setMediaUrls(prev => ({ ...prev, [claim.id]: Array.isArray(data.urls) ? data.urls : 'error' })))
                .catch(() => setMediaUrls(prev => ({ ...prev, [claim.id]: 'error' })));
        }
    };

    if (fetching) return <div className="bg-white rounded-2xl h-32 animate-pulse" />;
    if (claims.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-zinc-200">
                <p className="text-zinc-400 text-lg">Zatím nemáte žádné reklamace.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {claims.map(claim => {
                const status = CLAIM_STATUS[claim.status] || { label: claim.status, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
                const open = expanded === claim.id;
                const media = mediaUrls[claim.id];
                return (
                    <div key={claim.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
                        <button onClick={() => toggle(claim)} className="w-full p-4 flex items-center gap-4 text-left">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${status.cls}`}>{status.label}</span>
                                    <span className="text-xs text-zinc-400">
                                        {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-zinc-900 mt-1 truncate">{claim.frameNumber}</div>
                                <div className="text-[11px] text-zinc-400 font-mono">č. {claim.id}</div>
                            </div>
                            <div className="text-right shrink-0 text-xs text-zinc-400">
                                {claim.media?.length > 0 && `${claim.media.length} příloh${claim.media.length === 1 ? 'a' : claim.media.length < 5 ? 'y' : ''}`}
                            </div>
                            <svg className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {open && (
                            <div className="px-4 pb-4 border-t border-zinc-100 pt-3 space-y-3">
                                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{claim.description}</p>

                                {claim.adminNote && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                        <div className="text-xs font-bold text-blue-700 uppercase mb-1">Vyjádření Biketime</div>
                                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{claim.adminNote}</p>
                                    </div>
                                )}

                                {claim.media?.length > 0 && (
                                    <div>
                                        {media === 'loading' && <div className="h-24 bg-zinc-50 rounded-xl animate-pulse" />}
                                        {media === 'error' && <p className="text-xs text-red-600">Přílohy se nepodařilo načíst.</p>}
                                        {Array.isArray(media) && (
                                            <div className="flex flex-wrap gap-3">
                                                {media.map(m => m.contentType.startsWith('video/') ? (
                                                    <video key={m.key} src={m.url} controls preload="metadata" className="h-40 rounded-xl bg-zinc-100" />
                                                ) : (
                                                    <a key={m.key} href={m.url} target="_blank" rel="noopener noreferrer" title={m.fileName}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={m.url} alt={m.fileName} className="h-24 rounded-xl object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ClaimsPage() {
    const { firebaseUser, shopUser } = useAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [fetching, setFetching] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [justCreated, setJustCreated] = useState(false);

    useEffect(() => {
        if (!firebaseUser || !shopUser?.hasAccess) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await apiGet('/api/claims', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}));
                if (!cancelled) setClaims(Array.isArray(data.claims) ? data.claims : []);
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firebaseUser, shopUser?.hasAccess, reloadKey]);

    if (!shopUser?.hasAccess) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-10 text-center">
                <h1 className="text-xl font-bold text-zinc-900 mb-2">Reklamace jsou pro partnery</h1>
                <p className="text-sm text-zinc-500">Po schválení vašeho účtu zde budete moci zadávat servisní případy.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Reklamace</h1>
            <p className="text-sm text-zinc-500 mb-5">Servisní případy a reklamace kol. O změnách stavu vás informujeme e-mailem.</p>

            {justCreated && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 mb-4">
                    Reklamace byla odeslána. Potvrzení jsme vám poslali e-mailem.
                </div>
            )}

            <ClaimForm onCreated={() => { setJustCreated(true); setFetching(true); setReloadKey(k => k + 1); }} />

            <ClaimList claims={claims} fetching={fetching} />
        </div>
    );
}
