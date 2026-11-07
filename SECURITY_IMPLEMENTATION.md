# Viraasat 2.0 – Security Implementation Guide

**Document Version:** 1.0  
**Scope:** Production Hardening across Next.js, Clerk, Supabase, Razorpay, and Android APK

---

## 1. Authentication and Route Protection

### Middleware Hardening (`frontend/src/proxy.ts`)
- **Protected Paths:** All non-public routes now pass through Clerk's `auth.protect()`. Specifically:
  - `/artisan(.*)`
  - `/dashboard(.*)`
  - `/orders(.*)`
  - `/admin(.*)`
  - Mutative API routes (`/api/create-order`, `/api/verify-payment`, `/api/products` [POST], `/api/reviews` [POST/PUT/DELETE], `/api/upload`, `/api/auctions/bid`)
- **Public Routes:** Strictly limited to public catalog browsing, legal documentation, and sign-in/sign-up flows.
- **Fail-Safe Mechanism:** Hardcoded fallback secrets have been removed; unconfigured environments reject requests gracefully without exposing fallback keys.

### Client-Side Guard Hardening (`frontend/src/features/auth/components/protected-route.tsx`)
- Removed the insecure check allowing unauthenticated users to access routes via `localStorage.getItem('viraasat_session_role')`.
- All dashboard pages strictly require `isSignedIn && user`.
- Roles are validated from verified Clerk session claims and server database records.

---

## 2. API Hardening & Input Validation

### Structured Validation with Zod (`frontend/src/lib/validation/schemas.ts`)
- `CreateOrderRequestSchema`: Enforces valid item arrays, quantity range `[1, 99]`, shipping address schemas, and postal code regex.
- `VerifyPaymentSchema`: Validates Razorpay `order_id`, `payment_id`, and HMAC `signature` formats.
- `AdminPinSchema`: Enforces minimum length and format bounds.
- `ProductMutationSchema`: Enforces positive price thresholds, name length, and description constraints.
- `CreateReviewSchema`: Validates rating integer bounds `[1, 5]` and text limits.
- `AuctionBidSchema`: Validates auction ID and positive integer bid amount.

### Sliding-Window Rate Limiting (`frontend/src/lib/rate-limiter.ts`)
- Added IP-based and user-based token bucket / sliding window rate limiting:
  - **Admin PIN Verification:** Max 5 attempts per 15 minutes.
  - **Order Creation & Verification:** Max 10 requests per minute.
  - **Product Mutations:** Max 20 requests per minute.
  - **Review Mutations:** Max 6 requests per minute.
  - **Auction Bids:** Max 15 bids per minute.
  - **File Uploads:** Max 10 uploads per minute.
  - **General Forms:** Max 10 requests per minute.

---

## 3. Payment & Order Security

### Server-Side Price Verification (`frontend/src/app/api/create-order/route.ts`)
- When creating orders, the server recalculates total prices from the authoritative catalog (`CATALOG.get(item.productId)`).
- Subtotal + 18% GST + shipping options are computed server-side.
- If a client-supplied amount diverges from the server calculation, the order is rejected with status 400 and logged as `PAYMENT_PRICE_TAMPERING_ATTEMPT`.
- Orders require authenticated Clerk sessions.

### Constant-Time Signature Verification (`frontend/src/app/api/verify-payment/route.ts`, `razorpay/webhook/route.ts`)
- Replaced standard equality with `crypto.timingSafeEqual` with buffer length checking:
  ```ts
  function verifyTimingSafeSignature(expected: string, actual: string): boolean {
    const bufExpected = Buffer.from(expected);
    const bufActual = Buffer.from(actual);
    if (bufExpected.length !== bufActual.length) {
      crypto.timingSafeEqual(bufExpected, bufExpected);
      return false;
    }
    return crypto.timingSafeEqual(bufExpected, bufActual);
  }
  ```

---

## 4. Live Auction Security

### Server-Side Auction Service (`frontend/src/features/auctions/services/auction-store.ts`)
- **Self-Bidding Guard:** Prevents artisans from bidding on their own listings:
  ```ts
  if (bidder.email === auction.sellerEmail || bidder.userId === auction.artisanName) {
    return { success: false, error: 'Artisans cannot bid on their own handcrafted auction listings.' };
  }
  ```
- **Expiration Guard:** Bids submitted after `auction.endTime` are automatically rejected.
- **Minimum Increment:** Bids must exceed `auction.currentBid + auction.minIncrement`.
- **Atomic Mutex Lock:** Concurrency locks on each `auctionId` ensure that race-condition bids are queued and evaluated in strict sequential order.
- **Server API Route (`/api/auctions/bid`):** Validates session with Clerk, throttles bids to 15/min, and emits audit logs for failed bid attempts.

---

## 5. File Upload & Binary Magic-Byte Security

### File Verification (`frontend/src/lib/validation/image-signature.ts`, `/api/upload/route.ts`)
- Examines raw binary headers before processing:
  - **JPEG:** `0xFF 0xD8 0xFF`
  - **PNG:** `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
  - **WebP:** `0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50`
- Rejects files masquerading as images (e.g. PHP scripts, bash scripts, PE executables).
- Enforces a 5MB size limit.
- Generates collision-resistant random UUID filenames (`crypto.randomUUID() + ext`).

---

## 6. Database Row-Level Security (Supabase)

### Migration Script: `database/security_hardening_rls.sql`
- **Buyer Profiles:** Restricted `SELECT` to `user_id = auth.uid()::text`, completely preventing anonymous scraping of customer phone numbers and home addresses.
- **Reviews:**
  - `SELECT`: Public for published reviews.
  - `UPDATE`: Limited to review author, or assigned artisan updating response fields, or admin.
  - `DELETE`: Limited to review author or admin.
- **Notifications:** Restricted `SELECT` and `UPDATE` to the intended notification recipient (`user_id = auth.uid()::text`).
- **Products:** Artisans can only mutate products matching their verified `artisan_id`.
- **Artisan Applications:** Public can insert; reading PII is strictly restricted to verified administrators.
- **Storage Buckets:** RLS policies enforced on `avatars` and `product-images`.

---

## 7. Mobile APK Hardening

### Build Script: `scripts/build_full_apk.py`
- Disabled cleartext traffic: `android:usesCleartextTraffic="false"`.
- Disabled adb backup: `android:allowBackup="false"`.
- Enforced HTTPS only in WebView: `settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)`.
- Implemented WebView domain whitelisting in `MainActivity.java`:
  - Allowed origins: `*.virrasat.in`, `*.viraasat.in`, `*.clerk.accounts.dev`, `*.clerk.com`, `*.razorpay.com`.
  - Untrusted external links are redirected safely out of the WebView into the external Android browser via `Intent.ACTION_VIEW`.

---

## 8. Security Monitoring & Event Logging

### Logger Utility: `frontend/src/lib/security-logger.ts`
- Emits structured, machine-readable JSON security logs.
- Automatically redacts sensitive fields (`password`, `token`, `secret`, `pin`, `cvv`, `signature`).
- Logs critical security events:
  - `AUTH_UNAUTHORIZED_ACCESS`
  - `RBAC_PRIVILEGE_VIOLATION`
  - `ADMIN_PIN_FAILED` / `ADMIN_PIN_RATE_LIMITED`
  - `PAYMENT_PRICE_TAMPERING_ATTEMPT`
  - `PAYMENT_SIGNATURE_MISMATCH`
  - `AUCTION_SELF_BID_ATTEMPT` / `AUCTION_EXPIRED_BID_ATTEMPT`
  - `MALICIOUS_FILE_UPLOAD_BLOCKED`
  - `RATE_LIMIT_EXCEEDED`
