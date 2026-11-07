# Viraasat 2.0 – Complete Application Security Audit Report

**Date:** November 2026  
**Auditor:** Senior Application Security Engineer & Backend Security Architect  
**Target:** Viraasat 2.0 Web Application & Android APK  
**Repository:** `https://github.com/Aayush9-spec/viraasat`  
**Production Domain:** `https://virrasat.in`

---

## Executive Summary

A comprehensive application security audit of the Viraasat 2.0 platform was conducted across authentication, role-based access control (RBAC), database Row-Level Security (RLS), payment verification, auction integrity, file upload processing, AI safety, browser security headers, and the mobile APK packaging. 

Thirteen distinct vulnerabilities were discovered, ranging from Critical to Medium severity. Immediate remediations were implemented, verified with automated security tests, and compiled into production builds.

---

## Vulnerability Classification Matrix

| ID | Vulnerability Title | Category | Severity | CVSS v3.1 | Status |
|---|---|---|---|---|---|
| **VULN-01** | Open Middleware Route Matcher & Hardcoded Fallback Secrets | Authentication / RBAC | **Critical** | 9.8 | **Resolved** |
| **VULN-02** | Client-Side Role Bypass via Unvalidated LocalStorage | Authorization | **Critical** | 9.1 | **Resolved** |
| **VULN-03** | Hardcoded Admin PIN & Unthrottled Passcode Brute-Force | Authentication | **Critical** | 9.8 | **Resolved** |
| **VULN-04** | Client Price Tampering in Order Creation Route | Payment & Order Security | **Critical** | 8.8 | **Resolved** |
| **VULN-05** | Timing Attack on Payment & Webhook Signatures | Cryptography / Timing | **High** | 7.5 | **Resolved** |
| **VULN-06** | Unauthenticated Product Creation & ID Spoofing | Authorization (BOLA/IDOR) | **Critical** | 9.1 | **Resolved** |
| **VULN-07** | BOLA / IDOR in Product Review Mutations & Replies | Authorization (BOLA/IDOR) | **High** | 8.1 | **Resolved** |
| **VULN-08** | Permissive Supabase RLS Policies (PII Leakage in Buyer Profiles) | Database Security (Supabase) | **Critical** | 8.6 | **Resolved** |
| **VULN-09** | Unvalidated Client-Side Auction Bidding & Race Conditions | Business Logic / Auctions | **High** | 7.5 | **Resolved** |
| **VULN-10** | Cleartext Traffic & Unrestricted WebView Navigation in Mobile APK | Mobile Security | **High** | 7.4 | **Resolved** |
| **VULN-11** | Missing Content Security Policy (CSP) & HSTS Headers | Browser Security | **Medium** | 6.5 | **Resolved** |
| **VULN-12** | Unthrottled API Endpoints (DoS & Flooding Risk) | API Security | **Medium** | 6.3 | **Resolved** |
| **VULN-13** | Lack of Binary Magic-Byte Verification in File Uploads | Upload Security | **High** | 7.8 | **Resolved** |

---

## Detailed Vulnerability Analysis

### VULN-01: Open Middleware Route Matcher & Hardcoded Fallback Secrets
- **Severity:** Critical (CVSS 9.8)
- **Component:** `frontend/src/proxy.ts`
- **Finding:** In Next.js middleware, `isPublicRoute` explicitly matched `/artisan(.*)`, `/dashboard(.*)`, `/orders(.*)`, and `/api(.*)`. Consequently, `auth.protect()` was bypassed for all artisan management and private dashboard paths. Furthermore, fallback Clerk test secret keys (`sk_test_...`) were hardcoded in source code if environment variables were missing.
- **Impact:** Any unauthenticated actor could access internal dashboard layouts and invoke sensitive mutative API endpoints.
- **Remediation:** Removed `/artisan(.*)`, `/dashboard(.*)`, `/orders(.*)`, `/admin(.*)`, and private mutative API endpoints from `isPublicRoute`. Removed hardcoded secret fallback keys. Unauthenticated requests are rejected with 401 (API) or redirected to `/login` (pages).

---

### VULN-02: Client-Side Role Bypass via Unvalidated LocalStorage
- **Severity:** Critical (CVSS 9.1)
- **Component:** `frontend/src/features/auth/components/protected-route.tsx`
- **Finding:** The client component checked `localStorage.getItem('viraasat_session_role')` when a user was not signed in. An unauthenticated visitor could open developer tools, run `localStorage.setItem('viraasat_session_role', 'artisan')`, and immediately gain access to artisan studio pages.
- **Impact:** Total bypass of client-side role enforcement.
- **Remediation:** Removed trusting unverified local storage roles. Enforced strict Clerk session verification (`isSignedIn && user`). User role is read from verified session claims or database records.

---

### VULN-03: Hardcoded Admin PIN & Unthrottled Passcode Brute-Force
- **Severity:** Critical (CVSS 9.8)
- **Component:** `frontend/src/app/api/admin/verify-pin/route.ts`
- **Finding:** The endpoint used `process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || 'Viraasat@Admin2026'`. The default passcode `'Viraasat@Admin2026'` was hardcoded in plaintext. Furthermore, prefixing with `NEXT_PUBLIC_` bundled the administrator PIN into client-side JavaScript. There was zero rate limiting, allowing automated brute-force attacks in minutes.
- **Impact:** Complete administrative takeover.
- **Remediation:** Removed default fallback PIN and `NEXT_PUBLIC_` reference; the passcode is read strictly from `process.env.ADMIN_PIN`. Enforced strict rate limiting (max 5 attempts per 15 minutes per IP) with temporary lockout. Switched string comparison to `crypto.timingSafeEqual`.

---

### VULN-04: Client Price Tampering in Order Creation Route
- **Severity:** Critical (CVSS 8.8)
- **Component:** `frontend/src/app/api/create-order/route.ts`
- **Finding:** The endpoint accepted `amount` directly from `req.json()` and forwarded it to Razorpay without recalculating catalog prices. An attacker could tamper with request bodies, ordering a ₹50,000 heirloom for ₹1 (100 paise).
- **Impact:** Financial loss and fraudulent order placement.
- **Remediation:** Implemented mandatory server-side catalog price recalculation (`CATALOG.get(item.productId)`). The server verifies item unit prices, applies GST (18%) and shipping fees, and compares against client parameters. If discrepancies exceed rounding tolerance, the transaction is rejected and logged as a `PAYMENT_PRICE_TAMPERING_ATTEMPT`.

---

### VULN-05: Timing Attack on Payment & Webhook Signatures
- **Severity:** High (CVSS 7.5)
- **Component:** `frontend/src/app/api/verify-payment/route.ts`, `frontend/src/app/api/razorpay/webhook/route.ts`
- **Finding:** Signature comparison was performed using JavaScript's non-constant-time equality operators (`expectedSignature === signature`).
- **Impact:** Side-channel timing attacks could allow attackers to forge valid signatures by measuring response latency variations.
- **Remediation:** Replaced with `crypto.timingSafeEqual` with buffer length matching.

---

### VULN-06: Unauthenticated Product Creation & ID Spoofing
- **Severity:** Critical (CVSS 9.1)
- **Component:** `frontend/src/app/api/products/route.ts`
- **Finding:** The `POST` handler accepted products without verifying authentication or user identity. Any anonymous actor could send a payload specifying arbitrary `artisanId` values, listing counterfeit products or modifying catalog state.
- **Impact:** Catalog poisoning, craft provenance fraud, and reputation damage.
- **Remediation:** Enforced Clerk server authentication (`auth()`), verified caller holds the `'artisan'` or `'admin'` role, and bound `artisanId` strictly to the authenticated `userId`.

---

### VULN-07: BOLA / IDOR in Product Review Mutations & Replies
- **Severity:** High (CVSS 8.1)
- **Component:** `frontend/src/app/api/reviews/route.ts`
- **Finding:** `POST`, `PUT`, and `DELETE` handlers fell back to client-provided parameters (`body.reviewerId || 'demo-user'`, `body.artisanId || 'artisan-1'`, `searchParams.get('userId')`).
- **Impact:** Any user could impersonate verified patrons, forge artisan official responses, or delete legitimate customer feedback.
- **Remediation:** Enforced strict session resolution. Review creation binds reviewer ID strictly to `auth().userId`. Artisan replies verify the caller is an artisan or admin. Review deletion verifies ownership or admin privileges.

---

### VULN-08: Permissive Supabase RLS Policies (PII Leakage in Buyer Profiles)
- **Severity:** Critical (CVSS 8.6)
- **Component:** `database/supabase_patch.sql`, `database/reviews_ratings_notifications_migration.sql`
- **Finding:** The `buyer_profiles` table had policy `CREATE POLICY "buyer_own_read" ON buyer_profiles FOR SELECT USING (true);`. This allowed any anonymous client with the public anon key to read customer phone numbers, home addresses, and postal codes. Furthermore, `reviews` and `notifications` used `USING (true)` for updates and deletes.
- **Impact:** Massive Personally Identifiable Information (PII) data breach and violation of Indian DPDP Act.
- **Remediation:** Authored `database/security_hardening_rls.sql`. Restricted `buyer_profiles` SELECT to `user_id = auth.uid()::text`. Hardened `reviews` UPDATE/DELETE to author/artisan/admin only. Restricted `notifications` SELECT/UPDATE to notification recipient only.

---

### VULN-09: Unvalidated Client-Side Auction Bidding & Race Conditions
- **Severity:** High (CVSS 7.5)
- **Component:** `frontend/src/features/auctions/components/unique-art-auction-section.tsx`
- **Finding:** All auction bidding was executed purely within client React component state. There was no server-side endpoint validating bids, preventing artisan self-bidding (shill bidding), preventing bids after auction close, or handling simultaneous bids.
- **Impact:** Auction fraud, bid manipulation, and race condition inconsistencies.
- **Remediation:** Created `ServerAuctionService` and `/api/auctions/bid` route with mutex-based atomic concurrency locking, minimum increment verification, self-bidding prevention, expiration checks, and 15/min rate limits.

---

### VULN-10: Cleartext Traffic & Unrestricted WebView Navigation in Mobile APK
- **Severity:** High (CVSS 7.4)
- **Component:** `scripts/build_full_apk.py`
- **Finding:** The Android manifest configured `android:usesCleartextTraffic="true"` and `android:allowBackup="true"`. The WebView allowed mixed content (`MIXED_CONTENT_COMPATIBILITY_MODE`) and loaded any URL in `handleUrl` without domain whitelisting.
- **Impact:** Man-in-the-Middle (MitM) packet sniffing, plain-text token interception, backup extraction, and WebView open redirects.
- **Remediation:** Set `android:usesCleartextTraffic="false"`, `android:allowBackup="false"`, `settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)`. Whitelisted trusted domains (`virrasat.in`, `*.clerk.accounts.dev`, `*.razorpay.com`), routing untrusted external links safely into the system browser via `Intent.ACTION_VIEW`.

---

### VULN-11: Missing Content Security Policy (CSP) & HSTS Headers
- **Severity:** Medium (CVSS 6.5)
- **Component:** `frontend/src/proxy.ts`, `frontend/next.config.ts`
- **Finding:** HTTP responses lacked HSTS (`Strict-Transport-Security`) and Content Security Policy (CSP) headers.
- **Impact:** Vulnerability to clickjacking, protocol downgrade attacks, and unconstrained script execution.
- **Remediation:** Implemented comprehensive CSP in middleware and headers, along with `HSTS: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.

---

### VULN-12: Unthrottled API Endpoints (DoS & Flooding Risk)
- **Severity:** Medium (CVSS 6.3)
- **Component:** `/api/create-order`, `/api/verify-payment`, `/api/products`, `/api/reviews`, `/api/apply`, `/api/newsletter`
- **Finding:** Endpoints lacked request rate limiting, permitting credential brute-force, database resource exhaustion, and spamming.
- **Impact:** Denial of Service (DoS) and spam attacks.
- **Remediation:** Built a centralized token-bucket / sliding window rate limiter (`frontend/src/lib/rate-limiter.ts`) enforcing endpoint-specific limits (e.g. 10/min for orders, 5/15min for admin PIN, 6/min for reviews, 10/min for uploads).

---

### VULN-13: Lack of Binary Magic-Byte Verification in File Uploads
- **Severity:** High (CVSS 7.8)
- **Component:** `frontend/src/features/artisan/components/image-enhancer.tsx`, `/api/upload`
- **Finding:** Image validation checked only client file extensions and MIME types. An attacker could upload an executable shell script or polyglot renamed to `.png`.
- **Impact:** Malicious file storage, potential remote code execution or stored XSS.
- **Remediation:** Implemented `validateImageMagicBytes` in `/api/upload` inspecting initial binary signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`). Enforced 5MB size limit and cryptographic UUID filenames.
