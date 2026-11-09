# Viraasat 2.0 – Technical Bug Tracker & Issue Catalog

**Project:** Viraasat 2.0 – AI-Powered Indian Handicraft Marketplace  
**Audit Date:** November 9, 2026  
**Document Status:** Complete Audit Catalog  

---

## Summary of Tracked Issues

| Bug ID | Title | Severity | Component / Path | Status |
| :--- | :--- | :---: | :--- | :---: |
| **BUG-001** | Invalid UUID Syntax (`22P02`) when querying Supabase with Clerk User IDs | **Critical** | `src/features/orders/order-service.ts`, `review-service.ts` | **Resolved in Phase 1** |
| **BUG-002** | Notifications Table Returns 404 (Not Found) on Supabase REST API | **High** | `src/features/notifications/notification-service.ts` | **Migration Provided & Guarded** |
| **BUG-003** | Client-Side 403 Forbidden Polling on Admin-Restricted `/api/users` Route | **High** | `src/app/api/users/route.ts`, `use-auth-form.ts` | **Resolved in Phase 1** |
| **BUG-004** | Paid Razorpay Orders Not Persisted to Database After Signature Verification | **High** | `src/features/checkout/components/checkout-page.tsx`, `/api/verify-payment` | **Resolved in Phase 1** |
| **BUG-005** | Auction Bidding State Maintained in Volatile In-Memory Node.js Map | **High** | `src/features/auctions/services/auction-store.ts` | **Resolved in Phase 2** |
| **BUG-006** | Hardcoded Razorpay Secret in GitHub Actions Workflow File | **Medium** | `.github/workflows/ci.yml` | **Resolved in Phase 2** |
| **BUG-007** | Backend Python Virtualenv Contains Broken External Drive Shebang Paths | **Medium** | `backend/venv/` | **Resolved in Phase 2** |
| **BUG-008** | Mobile Floating Chatbot Button Overlaps Bottom Navigation on Narrow Screens | **Low** | `src/features/ai/components/ai-assistant.tsx` | **Resolved in Phase 3** |
| **BUG-009** | Dual Android APK Architecture Inconsistency (WebView Wrapper vs Expo) | **Informational** | `scripts/build_full_apk.py`, `mobile/` | Documented |

---

## Detailed Bug Reports

### BUG-001: Invalid UUID Syntax (`22P02`) when querying Supabase with Clerk User IDs

- **Bug ID:** `BUG-001`
- **Title:** PostgreSQL Type Syntax Error (`22P02`) on Orders & Reviews Queries with Clerk String IDs
- **Severity:** **Critical**
- **Component / Route / File Path:**
  - `frontend/src/features/orders/order-service.ts` (lines 45–62)
  - `frontend/src/features/reviews/review-service.ts` (line 455)
  - `/dashboard?tab=orders`, `/dashboard?tab=profile`
- **Description:**
  When an authenticated customer opens their customer dashboard or navigates to order history, the application attempts to fetch past orders from Supabase using their Clerk user ID (`user_3KdRev6IL5NF4TmNCCyp9aBXcld`). PostgREST evaluates the query against the PostgreSQL `orders.buyer_id` column (which is typed as `uuid`), causing PostgreSQL to terminate the query with error code `22P02` (invalid input syntax for type uuid).
- **Steps to Reproduce:**
  1. Log into `https://www.virrasat.in` as an authenticated patron with Clerk.
  2. Navigate to `/dashboard?tab=orders` or `/dashboard?tab=profile`.
  3. Open Chrome DevTools > Console & Network tab.
  4. Observe network request:
     `GET https://mkeowabbnpyenqeiybzw.supabase.co/rest/v1/orders?select=id%2Cbuyer_id...&buyer_id=eq.user_3KdRev6IL5NF4TmNCCyp9aBXcld`
  5. The server returns HTTP 400 with body:
     ```json
     {"code": "22P02", "details": null, "hint": null, "message": "invalid input syntax for type uuid: \"user_3KdRev6IL5NF4TmNCCyp9aBXcld\""}
     ```
- **Expected Behavior:**
  The query should either translate the Clerk user ID to an internal user UUID, or query a column typed as `TEXT`, returning an empty list or the user's orders without database syntax errors.
- **Actual Behavior:**
  HTTP 400 Bad Request error returned; order retrieval fails and console logs a `22P02` exception.
- **Root Cause Analysis:**
  PostgreSQL enforces strong type checking. Supabase PostgREST parses `.eq('buyer_id', buyerId)` into SQL `WHERE buyer_id = 'user_...'::uuid`. When the string does not match the 32-character hexadecimal UUID format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`, PostgreSQL immediately throws error `22P02`. In `order-service.ts`, line 53 also attempted `.or('email.eq.${buyerId},id.eq.${buyerId}')` which similarly casts `buyerId` to UUID on `users.id`.
- **Recommended Fix:**
  1. In `database/`, execute an `ALTER TABLE orders ALTER COLUMN buyer_id TYPE TEXT;` migration.
  2. In `order-service.ts`, validate `isUuid` before querying UUID columns:
     ```typescript
     if (!isUuid(buyerId)) {
       const { data: userRow } = await supabase
         .from('users')
         .select('id')
         .eq('email', userEmail)
         .maybeSingle();
       if (userRow?.id) queryId = userRow.id;
       else return [];
     }
     ```

---

### BUG-002: Notifications Table Returns 404 (Not Found) on Supabase REST API

- **Bug ID:** `BUG-002`
- **Title:** Supabase REST Endpoint for Notifications Returns 404 Not Found
- **Severity:** **High**
- **Component / Route / File Path:**
  - `frontend/src/features/notifications/notification-service.ts` (lines 80–115)
  - Remote Supabase instance `mkeowabbnpyenqeiybzw.supabase.co`
- **Description:**
  Calls to fetch customer or artisan notifications directly via Supabase client return `404 Not Found`.
- **Steps to Reproduce:**
  1. Open Chrome DevTools on `https://www.virrasat.in/dashboard`.
  2. Inspect network activity for `notifications`.
  3. Notice `GET https://mkeowabbnpyenqeiybzw.supabase.co/rest/v1/notifications?...` returns `404 (Not Found)`.
- **Expected Behavior:**
  Notifications endpoint should return `200 OK` with JSON array of notification records.
- **Actual Behavior:**
  Returns HTTP 404, causing fallback to local notification storage.
- **Root Cause Analysis:**
  The table `notifications` defined in `database/reviews_ratings_notifications_migration.sql` was created in code but not yet migrated in the active Supabase PostgreSQL database project. PostgREST returns 404 when querying a table that does not exist in the database schema schema cache.
- **Recommended Fix:**
  Execute `database/reviews_ratings_notifications_migration.sql` in the Supabase SQL Editor for project `mkeowabbnpyenqeiybzw`.

---

### BUG-003: Client-Side 403 Forbidden Polling on Admin-Restricted `/api/users` Route

- **Bug ID:** `BUG-003`
- **Title:** Repeated 403 Forbidden Errors When Non-Admin Patrons Trigger `/api/users`
- **Severity:** **High**
- **Component / Route / File Path:**
  - `frontend/src/app/api/users/route.ts` (lines 12–35)
  - `frontend/src/features/auth/hooks/use-auth-form.ts` (lines 456, 661, 999, 1069)
- **Description:**
  When a registered customer or artisan signs in or updates preferences, browser console shows repeated `GET /api/users 403 (Forbidden)`.
- **Steps to Reproduce:**
  1. Sign in as a regular customer.
  2. Navigate to customer dashboard or complete an auth state change.
  3. Check Network panel for requests to `/api/users`.
  4. Request receives HTTP 403 with `{"error": "Forbidden: Admin privilege required"}`.
- **Expected Behavior:**
  Regular customer requests should not query an administrative endpoint. Profile operations should use `/api/users/profile`.
- **Actual Behavior:**
  Repeated 403 errors clutter browser console and server security logs.
- **Root Cause Analysis:**
  `GET /api/users` was designed for administrative user management (`if (role !== 'admin') return 403`). Certain authentication hooks inadvertently invoked `/api/users` to verify user existence instead of the customer profile endpoint `/api/users/profile`.
- **Recommended Fix:**
  Route customer profile synchronization exclusively through `/api/users/profile`. Update `use-auth-form.ts` to call `/api/users/profile`.

---

### BUG-004: Paid Razorpay Orders Not Persisted to Database After Signature Verification

- **Bug ID:** `BUG-004`
- **Title:** Missing Server-Side Database Order Insertion in Checkout Payment Flow
- **Severity:** **High**
- **Component / Route / File Path:**
  - `frontend/src/features/checkout/components/checkout-page.tsx` (lines 173–230)
  - `frontend/src/app/api/verify-payment/route.ts` (lines 80–115)
- **Description:**
  When a customer completes a Razorpay checkout, the client successfully verifies the HMAC signature via `/api/verify-payment`. However, neither the route nor the client writes the completed order to the Supabase PostgreSQL database. The order is only saved in browser `localStorage` and `sessionStorage`.
- **Steps to Reproduce:**
  1. Add an item to cart and proceed to `/checkout`.
  2. Complete payment via Razorpay test mode.
  3. Observe successful payment verification.
  4. Clear browser `localStorage` or open `/dashboard?tab=orders` on another device.
  5. The order list is completely empty.
- **Expected Behavior:**
  The order should be persisted to the `orders` and `order_items` tables in PostgreSQL upon payment verification.
- **Actual Behavior:**
  Order only exists in local browser memory.
- **Root Cause Analysis:**
  `/api/verify-payment` validates the HMAC signature but lacks an insert query into Supabase `orders`.
- **Recommended Fix:**
  In `/api/verify-payment/route.ts`, after verifying the timing-safe HMAC signature, create the order in Supabase with `status: 'paid'`, `payment_id`, `amount`, and `buyer_id`.

---

### BUG-005: Auction Bidding State Maintained in Volatile In-Memory Node.js Map

- **Bug ID:** `BUG-005`
- **Title:** Live Auction Bids Lost Across Serverless Lambda Invocations
- **Severity:** **High**
- **Component / Route / File Path:**
  - `frontend/src/features/auctions/services/auction-store.ts` (line 120)
  - `frontend/src/app/api/auctions/bid/route.ts`
- **Description:**
  Auction items and bids are stored in an in-memory `Map` (`auctionsStore`). In a serverless environment (such as Vercel), each cold start resets the store to `INITIAL_AUCTIONS`. Bids placed on one instance are invisible to other instances.
- **Steps to Reproduce:**
  1. Place a valid bid on an active auction.
  2. Trigger a redeploy or wait for lambda instance recycling.
  3. Refresh the auction page.
  4. The bid history resets to default seed data.
- **Expected Behavior:**
  Bids should be permanently recorded in a database with atomic locking.
- **Actual Behavior:**
  State resides in ephemeral Node.js memory.
- **Root Cause Analysis:**
  Serverless functions are stateless and do not share process memory.
- **Recommended Fix:**
  Create an `auctions` and `auction_bids` table in Supabase. Use a PostgreSQL stored procedure (`place_auction_bid`) with `FOR UPDATE` row-level locking to atomically record bids.

---

### BUG-006: Hardcoded Razorpay Secret in GitHub Actions Workflow File

- **Bug ID:** `BUG-006`
- **Title:** Hardcoded Payment Secret in `.github/workflows/ci.yml`
- **Severity:** **Medium**
- **Component / Route / File Path:**
  - `.github/workflows/ci.yml` (line 132)
- **Description:**
  The backend CI job defines `RAZORPAY_KEY_SECRET: AGxzrZj2IpfG0qxWNrX7KEfu` directly as a plain-text environment variable in source code.
- **Steps to Reproduce:**
  1. Inspect line 132 of `.github/workflows/ci.yml`.
  2. See raw key string committed in repository.
- **Expected Behavior:**
  All secret keys should be stored in GitHub Repository Secrets and accessed via `${{ secrets.RAZORPAY_KEY_SECRET }}`.
- **Actual Behavior:**
  Plain-text secret committed in version control.
- **Root Cause Analysis:**
  Convenience override for automated CI test execution.
- **Recommended Fix:**
  Replace with `${{ secrets.RAZORPAY_KEY_SECRET }}` or use a clearly randomized mock string (e.g. `mock_ci_secret_00000000`).

---

### BUG-007: Backend Python Virtualenv Contains Broken External Drive Shebang Paths

- **Bug ID:** `BUG-007`
- **Title:** `backend/venv` Virtual Environment Hardcoded to External Storage Drive
- **Severity:** **Medium**
- **Component / Route / File Path:**
  - `backend/venv/bin/pytest`
- **Description:**
  Running `./venv/bin/pytest` fails immediately with error:
  `./venv/bin/pytest: line 2: /Volumes/Crucial X9/projects /project /viraasat/viraasat/backend/venv/bin/python: No such file or directory`
- **Steps to Reproduce:**
  1. Open terminal in `backend/`.
  2. Run `./venv/bin/pytest`.
  3. Observe execution failure.
- **Expected Behavior:**
  Virtual environment shebangs should reference the local workspace path or use `#!/usr/bin/env python3`.
- **Actual Behavior:**
  Executables point to nonexistent `/Volumes/Crucial X9/...` path.
- **Root Cause Analysis:**
  The virtual environment was copied from an external drive instead of being generated via `python3 -m venv venv`.
- **Recommended Fix:**
  Recreate the virtual environment locally:
  `cd backend && rm -rf venv && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt -r requirements-dev.txt`.

---

### BUG-008: Mobile Floating Chatbot Button Overlaps Bottom Navigation on Narrow Screens

- **Bug ID:** `BUG-008`
- **Title:** Floating AI Assistant Obscures Bottom Navigation Icons on Mobile Screens
- **Severity:** **Low**
- **Component / Route / File Path:**
  - `frontend/src/features/ai/components/ai-assistant.tsx` (lines 238–242)
- **Description:**
  On compact mobile screens (widths < 380px), the floating assistant button at `bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]` sits adjacent to the "Dashboard" navigation tab, occasionally causing accidental touch events.
- **Steps to Reproduce:**
  1. Open Chrome DevTools Device Mode (e.g. Galaxy S8 or iPhone SE).
  2. View `https://www.virrasat.in/`.
  3. Observe distance between floating chatbot and bottom navigation bar.
- **Expected Behavior:**
  Floating elements should remain comfortably separated from standard navigation bars.
- **Actual Behavior:**
  Button is close to bottom bar boundaries.
- **Recommended Fix:**
  Add media queries or increase bottom clearance to `bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))]` on viewports under 400px.

---

### BUG-009: Dual Android APK Architecture Inconsistency (WebView Wrapper vs Expo)

- **Bug ID:** `BUG-009`
- **Title:** Architectural Divergence Between Python WebView Packager and React Native Mobile Codebase
- **Severity:** **Informational**
- **Component / Route / File Path:**
  - `scripts/build_full_apk.py`
  - `mobile/`
- **Description:**
  The repository contains two independent mobile implementations:
  1. A standalone React Native Expo project in `mobile/`.
  2. A native Java/Android WebView wrapper created by `scripts/build_full_apk.py` which loads `https://www.virrasat.in/`.
  The distributed APK (`dist_apk/app-release.apk`) is the WebView wrapper, meaning changes to `mobile/` have no effect on the installed APK.
- **Expected Behavior:**
  The repository should maintain a unified mobile strategy and clear documentation regarding which mobile distribution is active.
- **Actual Behavior:**
  Dual architecture leads to confusion regarding mobile bug reports.
- **Recommended Fix:**
  Document the dual mobile architecture in `docs/` and establish `scripts/build_full_apk.py` as the active PWA/WebView distribution pipeline while maintaining `mobile/` for future native features.

