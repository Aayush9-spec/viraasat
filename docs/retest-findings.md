# Retest findings

> Historical report: the implementation and validation results below are superseded by [the final studio and repair review](final-studio-review.md).

Scope: current local working tree, including uncommitted remediation. Dataset sufficiency and model accuracy are excluded. This is a bounded review, not proof that all possible defects have been found.

## Fresh validation

- Frontend: 72 tests passed in 13 suites (`/tmp/retest-jest.log`).
- Backend: 33 tests passed; one Starlette/httpx deprecation warning (`/tmp/retest-pytest-verbose.log`). Use `backend/venv/bin/python`; the default Python has no pytest. The initial sandboxed run stalled; the permitted rerun completed.
- TypeScript: passed (`/tmp/retest-typecheck.log`).
- ESLint: zero errors, one anonymous default-export warning in the onboarding Playwright config (`/tmp/retest-lint.log`).
- Default Turbopack build: blocked by worker port binding, `Operation not permitted`, including the escalated attempt. This does not establish a source-code build failure (`/tmp/retest-build.log`).
- Alternative Webpack build: failed with a confirmed server-only import error (`/tmp/retest-webpack.log`).
- Browser suite: 10 failed against a fresh Webpack development server on port 9010 (`/tmp/retest-browser-fresh.log`). Server logs confirm HTTP 500 compile-error pages; checkout is protected with unavailable authentication. Accessibility findings on error pages do not establish ten independent application accessibility bugs. The initial port-9002 run failed with connection refused and was superseded.

## Remaining code and workflow findings

| # | Severity | Finding and evidence | Required correction |
|---|---|---|---|
| 1 | High | Webpack cannot compile: `frontend/src/services/backend/client.ts:24` dynamically imports Clerk's server module and is imported by the client `/shop` page. Reproduced in both build and browser server. | Separate browser-safe transport from server authentication. |
| 2 | High | `frontend/src/lib/server/commerce.ts:47` reads stock but neither checkout, verification nor webhook reserves/decrements it. Two buyers can pay for the same final unit. | Transactional reservation, capture settlement and expiry/release. |
| 3 | High | `frontend/src/features/checkout/components/checkout-page.tsx:119` generates a new idempotency UUID on every payment attempt. Retrying after an uncertain response creates another order instead of recovering the original; another payment can follow. Server reservations with missing provider IDs also have no recovery workflow. | Persist attempt identity across retries and reconcile ambiguous attempts with the provider. |
| 4 | High | `frontend/src/features/marketplace/product-service.ts:44` always merges static/local products; `frontend/src/lib/data.ts:249` includes `prod-1` IDs. Checkout accepts UUIDs backed by database rows only. Displayed demo items cannot be bought. | Separate demo browsing from purchasable inventory or seed real records and IDs. |
| 5 | Medium | Catalog list/detail queries in `frontend/src/features/marketplace/product-service.ts` do not filter `is_active`; mapping also drops this field. Admin flagging sets it false, but application reads do not enforce hiding. Actual exposure depends on deployed SELECT policies, which were unavailable. | Enforce visibility in queries and database policies; test flagged products. |
| 6 | High | `frontend/src/lib/server/commerce.ts:77` derives every paid order as Processing. No canonical shipment/delivery transition or customer refund-request workflow exists; `/refund` nevertheless promises a Request Refund action. | Implement fulfillment and refund requests with persisted lifecycle state. |
| 7 | Medium | `frontend/src/app/api/razorpay/webhook/route.ts:24` persists only full refunds. Partial refunds have no amount/status representation; history remains Paid. | Persist refunded amount and partial-refund state idempotently. |
| 8 | High | `frontend/src/app/apply/page.tsx:230` ignores Supabase's returned insert error and announces success. Separately `/api/apply` uses an anonymous insert-with-select and public GET, incompatible with the migration revoking SELECT on applications. | One authenticated, validated submission endpoint; check errors; restrict reads to admin. |
| 9 | Medium | `frontend/src/context/wishlist-context.tsx:135` ignores returned upsert/delete errors. Its Supabase client does not attach a Clerk token, so login alone does not authorize protected direct writes. Persistence may silently fail; deployed RLS behavior is unverified. | Use authenticated server endpoints or trusted token integration and handle returned errors. |
| 10 | High | `frontend/src/features/marketplace/components/reviews-section.tsx:48` runs fraud detection only in the browser and continues on non-OK/network failure, then inserts directly. The UI labels reviews verified without checking purchase evidence. | Authenticate review submission server-side, enforce moderation there, and derive verification from purchases. Database exploitability depends on actual RLS. |
| 11 | Medium | `frontend/src/app/api/orders/route.ts:12` returns at most 100 orders with no pagination. The artisan dashboard consumes this limited history, so older orders and aggregate totals can be incomplete. | Paginate history and compute aggregates independently. |
| 12 | Medium | `frontend/src/app/orders/page.tsx:140` displays totalAmount as Subtotal and always says Free Heritage Delivery, including orders charged express shipping. | Display saved subtotal, tax, shippingFee and total separately. |
| 13 | High | `frontend/src/lib/server/security.ts:30` identifies the database profile by current email, without a stable Clerk-ID mapping. Changing a verified primary email creates a new profile rather than retaining ownership links to products/wishlists. | Persist unique Clerk user ID and reconcile existing profiles before changing identity lookup. |

Except finding 1, these are source-confirmed gaps/risk paths, not successful live-provider reproductions. Unit test passing does not cover these complete workflows.

## Three deployment/verification blockers (separate from the 13 findings)

1. No cloud secret bindings or runtime variables are configured: Clerk, Supabase service access, Razorpay and Gemini live integrations remain unverified. Honest AI failure paths passing does not prove inference works.
2. Current enforced network policy allows package-manager hosts only, with no custom service hosts. Required application/provider destinations are absent. Environment configuration must be updated through its supported workflow; this audit did not change it.
3. Database migration, historical-order reconciliation and legacy custody reconciliation have not been applied/verified here. The new order history cannot establish compatibility with existing production records.

No application fixes, deployment, model training, commits or pushes were performed during this retest. Build-generated service-worker cache changes were reverted; existing remediation work was preserved.


## Subsequent implementation progress

The follow-up implements browser-safe backend transport, valid Next page exports, persistent checkout attempt keys, active database-only catalog reads, stable Clerk-ID profile lookup, complete paged order reads, correct subtotal/tax/shipping display, checked application submission through the authenticated API, and checked wishlist mutation errors.

Still open: transactional inventory/reservation lifecycle; ambiguous provider-order reconciliation; fulfillment and refund-request UI/backend; partial-refund accounting; authenticated wishlist transport and visible sync-failure handling; server-enforced review moderation. These remain code work, not merely missing credentials. Existing profile IDs must be backfilled with verified Clerk identities before rollout; do not guess mappings or enable the new profile lookup on an unreconciled production database. Application portfolio attachments also need durable upload/storage integration.

Frontend regression run: 72 passed. Lint: zero errors, one existing warning. Webpack compilation and generated TypeScript checks pass after removing the invalid page export; the build still emits dependency warnings. The browser suite has not yet been rerun after these fixes. No claim of complete production readiness is made.
