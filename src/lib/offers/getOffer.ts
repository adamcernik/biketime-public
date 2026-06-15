import 'server-only';
import { db } from '@/lib/firebase-server';
import { doc, getDoc } from 'firebase/firestore';
import type { Offer } from '@/types/Offer';
import { DEFAULT_EUR_TO_CZK } from '@/types/Offer';
import { SAMPLE_OFFER } from './sampleOffer';

/** Token used to serve the built-in demo offer (no Firestore needed). */
export const SAMPLE_OFFER_TOKEN = 'ukazka';

/** Firestore collection holding tailored offers. Shared with the admin app. */
const OFFERS_COLLECTION = 'offers';

/** Normalize a stored offer document into a complete Offer object. */
function normalize(id: string, data: Record<string, unknown>): Offer {
  return {
    id,
    title: (data.title as string) ?? undefined,
    client: (data.client as Offer['client']) ?? {},
    eurToCzk: (data.eurToCzk as number) || DEFAULT_EUR_TO_CZK,
    validUntil: (data.validUntil as string) ?? null,
    items: Array.isArray(data.items) ? (data.items as Offer['items']) : [],
    status: (data.status as Offer['status']) ?? undefined,
    createdAt: (data.createdAt as string) ?? undefined,
    updatedAt: (data.updatedAt as string) ?? undefined,
  };
}

/**
 * Fetch an offer by its public token (= Firestore document id). Returns the
 * built-in sample for the demo token, and null when not found or on error so
 * the page can render a clean 404.
 */
export async function getOffer(token: string): Promise<Offer | null> {
  if (token === SAMPLE_OFFER_TOKEN) return SAMPLE_OFFER;

  try {
    const snapshot = await getDoc(doc(db, OFFERS_COLLECTION, token));
    if (!snapshot.exists()) return null;
    return normalize(snapshot.id, snapshot.data() as Record<string, unknown>);
  } catch (error) {
    console.error('getOffer: failed to load offer', token, error);
    return null;
  }
}
