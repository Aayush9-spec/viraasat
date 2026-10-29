# Commerce, authorization and truthful AI remediation

## Code changes

- All frontend create-order and verification aliases share authenticated handlers. Amounts come from Supabase product prices, quantities are integer-validated and stock is checked. Demo-only catalog IDs cannot be purchased until seeded as real products.
- `commerce_orders` is the server-only source for checkout, buyer history, artisan order metrics, confirmation and Razorpay webhook state. A unique buyer/idempotency key reserves checkout before calling Razorpay. Pending/ambiguous attempts are not retried automatically. Signature verification is bound to the signed-in buyer, persisted order, amount, currency and provider-confirmed capture. A refunded order cannot be reconfirmed.
- Browser session storage is not proof of an order or payment. Confirmation errors preserve the cart and do not navigate to success.
- Users and products use server Supabase APIs, not local JSON writes. Profile updates whitelist display name; roles and email come from verified Clerk accounts. Admin roles are trusted publicMetadata, never unsafeMetadata, local storage or passcodes. Product ownership comes from the server-resolved user row.
- SQL revokes direct client mutations to protected tables. Product publishing, stock updates and admin moderation now use authenticated APIs. Uploaded product images use the product-images bucket with server-generated keys.
- Backend amount-only payment endpoints return 410. They cannot mint low-price or simulated orders. Use the website checkout endpoints instead.
- Ledger creation requires a verified administrator, records one truthful registration event and assigns initial custody to that registrar. Transfers require the signed current custodian and an account ID. This is custody of an application ledger, not proof of ownership or authenticity. Seed certification claims are not loaded. Existing legacy ledgers need separately verified custody reconciliation.
- Ledger validation checks the genesis block as well as every link. Concurrent appends cannot overwrite an existing block index.
- Image classification and translation fail explicitly rather than returning unrelated content. Image enhancement requires GEMINI_IMAGE_MODEL and a different generated image; otherwise the original stays unchanged. UI error handlers retain user input.

## Required deployment steps (not applied by this code change)

1. Back up existing Supabase data and apply `database/commerce_security_migration.sql` in the intended project. It assumes the project's users, products and artisan_applications tables exist. Review existing custom grants/RPCs and use a staging project first. The migration creates commerce_orders and product-images, adds compatible product columns, and revokes client access to sensitive operations.
2. Configure server-only SUPABASE_SERVICE_ROLE_KEY and explicit NEXT_PUBLIC_SUPABASE_URL. Never put the service key in a NEXT_PUBLIC variable. Use the same Supabase project for the public catalog client and server writes.
3. Configure Clerk publishable/secret keys. Set administrator/approved artisan roles using Clerk publicMetadata via trusted administration. Backend Clerk JWT templates must expose the trusted role (public metadata) as role or metadata.role; configure CLERK_ISSUER/JWKS and REQUIRE_AUTH=true in production. Unverified email accounts cannot use commerce mutations.
4. Configure RAZORPAY_KEY_ID (matching the public checkout key), RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET. Configure capture and webhook delivery to /api/razorpay/webhook. All persisted amounts are integer INR paise.
5. Reconcile legacy orders from Supabase's old orders/order_items and any Firestore orders into the new canonical store using verified Razorpay order/payment IDs before switching a live site's history. No automatic migration is provided: there is no verified mapping of historical IDs or payment states in this workspace. Do not fabricate Paid state for old rows. Preserve backups during reconciliation.
6. Existing hard-coded credentials found in the old middleware/payment code were removed from those paths; rotate any formerly exposed credentials outside this repository before deployment.
7. Set GEMINI_IMAGE_MODEL to a provider model supporting image output and configure its API credential. Validate actual image output in staging. Provider unavailability is now shown as failure, not success.

## Validation scope

Unit/regression tests use mocked external services and isolated backend storage. They test failure and authorization paths, not live payment capture or production database policy. Run staging checks with two buyer accounts, an artisan and an administrator: create/pay/capture/webhook/reload history; cross-user access; rejected payments; unavailable persistence; product publishing; stock updates; admin review; and ownership transfers. Check logs for ambiguous checkout reservations before retrying payment creation. Stock is checked at checkout creation; warehouse reservation/fulfillment is a separate workflow.

These code fixes are not a deployment or a claim that live credentials, migrations or historical data reconciliation have completed.

## Local validation results

- 72 frontend tests passed, including pricing, idempotency, ownership, capture checks, signed webhooks, refund ordering, user field allowlists, product persistence errors, and truthful AI failures.
- 33 backend tests passed, including unauthorized custody transfer, genesis tampering, duplicate block rejection, and retired payment endpoints.
- TypeScript and production build passed. Lint passed with one pre-existing warning in the ignored onboarding Playwright helper.
- Built-app smoke checks: homepage HTTP 200; protected pages and mutation endpoints HTTP 503 with the current missing credentials. This is intentional fail-closed behavior, not a successful live commerce integration test.
- No Supabase, Clerk, Razorpay or Gemini variable names were present in the execution environment. No migration, live payment, provider inference or deployment was performed.
