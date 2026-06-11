import { timingSafeEqual } from 'crypto';

/**
 * Timing-safe check of the `Authorization: Bearer <ADMIN_API_KEY>` header.
 * Fails closed when ADMIN_API_KEY is not configured.
 */
export function isAdminAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;

  const authHeader = request.headers.get('authorization') || '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
