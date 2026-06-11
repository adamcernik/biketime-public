# Security Audit - BikeTime Public

**Date**: 2026-02-18
**Scope**: Full security audit of the biketime-public Next.js application

---

## ✅ Status update — 2026-06-11 (remediation implemented)

| # | Finding | Status |
|---|---------|--------|
| 1 | Weak ADMIN_API_KEY | ⚠️ MANUAL — rotate the key (`openssl rand -hex 32`) in Vercel + .env.local |
| 2 | Service account key in .env.local | ⚠️ MANUAL — never committed to git (verified), but rotate if it ever left this machine |
| 3 | Unprotected `/api/shops/import` | ✅ FIXED — requires `Authorization: Bearer <ADMIN_API_KEY>` |
| 4 | Debug endpoints (`debug-search`, `test-images`) | ✅ FIXED — deleted (also deleted `/test-catalog` page) |
| 5 | CORS wildcard on admin routes | ✅ FIXED — `Access-Control-Allow-Origin: *` removed |
| 6 | Dev auth bypass (`import-moc`) | ✅ FIXED — auth checked unconditionally |
| 7 | Full document exposure (wholesale prices) | ✅ FIXED — `ekPl`, `uvpPl`, `uavpPl`, `vocCzk`, `ek`, `ekCzk` stripped recursively from all public API responses (`src/lib/apiSanitize.ts`) |
| 8 | No rate limiting | ⏳ OPEN — consider `@upstash/ratelimit`; partially mitigated by CDN caching (s-maxage=300) on public endpoints |
| 9 | Missing security headers | ✅ FIXED — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.ts` (CSP deliberately deferred — needs PostHog/Maps allowlist testing) |
| 10 | PII to PostHog | ✅ FIXED — `posthog.identify()` no longer sends email |
| 11 | Unbounded pageSize | ✅ FIXED — clamped 1–100 on catalog/katalog2/accessories |
| 12 | Timing-unsafe key comparison | ✅ FIXED — all 11 protected routes use `crypto.timingSafeEqual` via `src/lib/adminAuth.ts` |
| — | Vulnerable dependencies (new) | ✅ FIXED — Next 15.5.9→15.5.19, firebase-admin 13.6→13.10, firebase 12.3→12.14; 0 critical/high remain (10 moderate in firebase-admin transitive deps need v14 major bump) |
| — | `/monkeylink` editor unguarded (new) | ✅ FIXED — admin/poweradmin role required |
| — | Firestore rules (new) | ⏳ OPEN — rules live in admin repo; verify users cannot update own `priceLevel`/`role` |

---

## CRITICAL (Fix Immediately)

### 1. Weak Admin API Key
- **File**: `.env.local:23` — `ADMIN_API_KEY=biketime-secure-api-key-2026`
- Easily guessable, low entropy. Protects **all** admin endpoints (stock updates, imports, migrations).
- **Fix**: Generate a cryptographically strong key: `openssl rand -hex 32`

### 2. Firebase Service Account Key in .env.local
- **File**: `.env.local:22` — Base64-encoded service account with full private key
- If this file was ever committed to git, the key is compromised
- **Fix**: Verify `.env.local` was never committed (`git log --all --full-history -- .env.local`). Rotate the service account key in Firebase Console. Store only in deployment platform secrets (Vercel).

### 3. Unprotected Import Endpoint
- **File**: `src/app/api/shops/import/route.ts:34-62`
- Both POST and GET have **zero authentication** — anyone can reimport/overwrite shop data
- **Fix**: Add API key check (same pattern as other admin routes)

### 4. Debug/Test Endpoints Exposed
- `src/app/api/debug-search/route.ts` — returns raw product data, no auth
- `src/app/api/test-images/route.ts` — returns internal product codes (nrLf, EAN), no auth
- **Fix**: Delete these routes or add auth. They should not exist in production.

---

## HIGH (Fix This Week)

### 5. CORS Wildcard on Admin Routes
- `src/app/api/admin/update-public-stock/route.ts:38` — `Access-Control-Allow-Origin: '*'`
- `src/app/api/admin/migrate-order-status/route.ts:5` — same
- **Fix**: Restrict to your domain: `'https://biketime.cz'`

### 6. Admin Auth Bypassed in Development
- All admin routes only check auth in production (`process.env.NODE_ENV === 'production'`)
- **Fix**: Always check auth regardless of environment

### 7. Full Document Exposure on Public APIs
- `src/app/api/catalog/[id]/route.ts:17-25` — returns `{ id, ...productData }` (all fields)
- `src/app/api/accessories/[id]/route.ts:12-13` — same, may include wholesale prices (ekPl, uvpPl)
- **Fix**: Whitelist public fields in the response

### 8. No Rate Limiting
- No rate limiting on any endpoint. Admin endpoints perform expensive Firestore batch operations.
- **Fix**: Add rate limiting middleware (e.g., `@upstash/ratelimit` or Vercel Rate Limiting)

---

## MEDIUM (Fix This Sprint)

### 9. Missing Security Headers
- **File**: `next.config.ts` — no `headers()` configuration
- Missing: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`
- **Fix**: Add security headers in `next.config.ts`

### 10. PII Sent to PostHog
- **File**: `src/components/AuthProvider.tsx:102-112` — email sent to PostHog via `posthog.identify()`
- **Fix**: Hash the email or use UID only

### 11. Unbounded Pagination
- **File**: `src/app/api/catalog/route.ts:60-61` — `pageSize` has no upper limit
- **Fix**: `Math.min(parseInt(pageSize, 10), 100)`

### 12. Timing-Unsafe API Key Comparison
- All admin routes use `!==` for key comparison (vulnerable to timing attacks)
- **Fix**: Use `crypto.timingSafeEqual()`

---

## LOW / PASS

| Area | Status | Notes |
|------|--------|-------|
| XSS | PASS | No `dangerouslySetInnerHTML`, no `eval()`, React auto-escaping |
| CSRF | PASS | Firebase token auth, no session cookies |
| Dependencies | PASS | All packages up-to-date (Next 15.5.9, React 19.1.2, Firebase 12/13) |
| TypeScript | PASS | `strict: true` enabled |
| Image domains | PASS | Restricted to 3 specific HTTPS hosts |
| localStorage | PASS | Only non-sensitive UI preferences |
| Firebase client config | OK | `NEXT_PUBLIC_` keys are standard — security depends on Firestore rules |
| .gitignore | PASS | `.env*` excluded (line 34) |

---

## Remediation Plan

### Step 1: Immediate fixes (no code changes needed)
- Rotate ADMIN_API_KEY to strong random value
- Verify `.env.local` was never committed to git
- Restrict Google Maps API key in Google Cloud Console (HTTP referrer restriction)

### Step 2: Delete/protect debug endpoints
- Delete `src/app/api/debug-search/route.ts`
- Delete `src/app/api/test-images/route.ts`
- Add auth to `src/app/api/shops/import/route.ts`

### Step 3: Fix CORS and auth
- Replace `'*'` with specific origin in admin routes
- Remove dev-only auth bypass
- Add `crypto.timingSafeEqual` for key comparison

### Step 4: Harden responses and config
- Filter public fields in catalog/accessories detail endpoints
- Add security headers to `next.config.ts`
- Cap `pageSize` parameter
- Hash email before PostHog identify

### Verification
- Run `npm run build` to ensure no breakage
- Test admin endpoints with correct/incorrect API keys
- Verify CORS blocks cross-origin requests from unauthorized domains
- Check response bodies of public endpoints don't contain sensitive fields
