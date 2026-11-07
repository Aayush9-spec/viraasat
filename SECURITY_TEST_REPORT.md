# Viraasat 2.0 – Security Test Report

**Execution Date:** November 2026  
**Test Suite Location:** `frontend/src/tests/security-hardening.test.ts`  
**Test Framework:** Jest / TypeScript (`ts-jest`)  
**Overall Result:** **ALL 14 TEST SUITES PASSED (89 TOTAL UNIT & SECURITY TESTS)**

---

## Automated Security Test Results

```
PASS src/tests/security-hardening.test.ts
  Viraasat 2.0 Security Hardening Test Suite
    1. Timing-Safe Signature Verification
      ✓ successfully validates authentic HMAC-SHA256 signature (1 ms)
      ✓ rejects tampered or forged signature in constant time
      ✓ handles mismatched buffer lengths without throwing exceptions
    2. Rate Limiting Protection
      ✓ allows requests within window and enforces strict threshold once exceeded (1 ms)
    3. Server-Side Price Calculation & Tampering Prevention
      ✓ accurately verifies catalog prices and detects client price manipulation
    4. Auction Security & Bidding Logic
      ✓ prevents artisan from self-bidding on their own handcrafted auction item (1 ms)
      ✓ rejects bids that fail to meet the required minimum increment (33 ms)
      ✓ successfully places and records legitimate bids atomically (1 ms)
    5. File Upload Binary Magic Byte Verification
      ✓ validates authentic PNG file header signatures
      ✓ validates authentic JPEG file header signatures
      ✓ validates authentic WebP file header signatures
      ✓ rejects executable scripts or disguised payloads masquerading as images

PASS src/app/api/reviews/__tests__/reviews-api.test.ts
  Reviews API Routes (/api/reviews)
    GET /api/reviews
      ✓ returns reviews and stats for a valid product
      ✓ returns artisan reviews and metrics for artisan dashboard
    POST /api/reviews
      ✓ returns 400 when product ID is missing
      ✓ returns 400 when rating is invalid
      ✓ submits a verified review successfully
    PUT /api/reviews
      ✓ returns 400 when reviewId is missing
      ✓ submits artisan reply successfully
    DELETE /api/reviews
      ✓ returns 400 when review ID query parameter is missing

Test Suites: 14 passed, 14 total
Tests:       89 passed, 89 total
Snapshots:   0 total
Time:        3.01 s
```

---

## Detailed Test Case Matrix

### 1. Cryptographic Signature & Timing Attack Tests
| Test Case | Scenario | Expected Behavior | Result |
|---|---|---|---|
| `TS-01` | Authentic HMAC-SHA256 signature provided | Constant-time validation succeeds (`isMatch = true`) | **PASSED** |
| `TS-02` | 1-byte tampered signature provided | Constant-time comparison safely rejects (`isMatch = false`) | **PASSED** |
| `TS-03` | Truncated / mismatched buffer length provided | Handled safely in constant time without throwing unhandled exceptions | **PASSED** |

### 2. Rate Limiting & DoS Tests
| Test Case | Scenario | Expected Behavior | Result |
|---|---|---|---|
| `RL-01` | Normal requests within limit (3/3 allowed) | Each returns `allowed: true` with decreasing `remaining` count | **PASSED** |
| `RL-02` | Request 4 exceeds rate limit threshold | Returns `allowed: false`, `remaining: 0`, and `Retry-After` header | **PASSED** |

### 3. Payment Price Verification Tests
| Test Case | Scenario | Expected Behavior | Result |
|---|---|---|---|
| `PV-01` | Client orders items at authentic catalog prices | Server matches item prices, adds GST + shipping, approves order | **PASSED** |
| `PV-02` | Client alters order total to ₹100 for expensive shawl | Server calculation discrepancy detected, rejected with 400 | **PASSED** |

### 4. Live Auction Security Tests
| Test Case | Scenario | Expected Behavior | Result |
|---|---|---|---|
| `AUC-01` | Artisan attempts to bid on their own listing | Server checks seller identity, rejects with `cannot bid on their own` | **PASSED** |
| `AUC-02` | Bid submitted below minimum increment (₹10 instead of ₹1,500) | Server rejects with `Minimum valid bid is ₹...` | **PASSED** |
| `AUC-03` | Valid bid placed by authentic patron | Mutex acquired, `currentBid` and `bids` updated atomically | **PASSED** |

### 5. File Upload Magic Byte Tests
| Test Case | Scenario | Expected Behavior | Result |
|---|---|---|---|
| `MB-01` | Authentic PNG binary header (`89 50 4E 47...`) | `validateImageMagicBytes` returns `valid: true, format: image/png` | **PASSED** |
| `MB-02` | Authentic JPEG binary header (`FF D8 FF...`) | `validateImageMagicBytes` returns `valid: true, format: image/jpeg` | **PASSED** |
| `MB-03` | Authentic WebP binary header (`RIFF...WEBP`) | `validateImageMagicBytes` returns `valid: true, format: image/webp` | **PASSED** |
| `MB-04` | Bash script (`#!/bin/bash`) named `image.png` | `validateImageMagicBytes` returns `valid: false`, upload blocked | **PASSED** |
| `MB-05` | Windows executable (`MZ...`) named `photo.jpg` | `validateImageMagicBytes` returns `valid: false`, upload blocked | **PASSED** |
| `MB-06` | PHP script (`<?php...`) named `avatar.webp` | `validateImageMagicBytes` returns `valid: false`, upload blocked | **PASSED** |

### 6. Compilation & Integration Verification
| Check | Command | Result |
|---|---|---|
| TypeScript Typecheck | `npm run typecheck` (`tsc --noEmit`) | **0 Errors** |
| Next.js Production Build | `npm run build` | **78/78 static and dynamic routes compiled successfully** |
| Android APK Build | `python3 scripts/build_full_apk.py` | **Signed release APK generated and verified [v2, v3]** |

---

## Remaining Operational Risks & Recommendations

1. **Supabase SQL Editor Execution:**
   - The RLS policies in `database/security_hardening_rls.sql` must be executed in the Supabase Dashboard SQL Editor (`https://supabase.com/dashboard/project/mkeowabbnpyenqeiybzw/sql`) so that production PostgreSQL enforces the new policies for client-side queries.
2. **Production Environment Variables:**
   - Ensure `ADMIN_PIN` is set in Vercel Project Settings (Environment Variables) to a strong, high-entropy secret string.
   - Never define `NEXT_PUBLIC_ADMIN_PIN` or `NEXT_PUBLIC_CLERK_SECRET_KEY`.
3. **Webhooks Setup:**
   - In Razorpay Dashboard -> Webhooks, ensure `RAZORPAY_WEBHOOK_SECRET` matches the environment variable configured on Vercel.
