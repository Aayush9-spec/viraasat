# Viraasat 2.0 – Test Coverage, Quality & CI/CD Report

**Audited Systems:** Frontend (Jest + Playwright), Translation Checker, Backend (Pytest)  
**Lead Auditor:** Senior Full-Stack & QA Architect  
**Audit Date:** November 9, 2026  
**Status:** Complete  

---

## 1. Test Suite Execution Summary

```text
================================================================================
FRONTEND JEST UNIT TESTS:
Test Suites: 16 passed, 16 total
Tests:       115 passed, 115 total
Snapshots:   0 total
Time:        3.601 s
Result:      PASS (100% test pass rate)
================================================================================
TRANSLATION CHECKER:
Locales:     13 Indian languages + English (294 keys each)
Result:      PASS (100% key parity across all 13 locales)
================================================================================
ACCESSIBILITY (AXE PLAYWRIGHT):
Test Suites: 1 passed (tests/e2e/a11y.spec.ts)
Tests:       8 passed, 8 total
Violations:  0 serious / critical WCAG AA violations
Result:      PASS
================================================================================
```

---

## 2. Frontend Code Coverage Breakdown

The following table reflects module-level unit test coverage collected from Jest:

| Module Category | File / Path | % Stmts | % Branch | % Funcs | % Lines | Status / Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Authentication Form** | `src/features/auth/components/login-form.tsx` | 75.0% | 80.5% | 50.0% | 73.3% | Core signin/signup flows tested |
| **Authentication Logic** | `src/features/auth/hooks/use-auth-form.ts` | 20.4% | 12.9% | 41.9% | 20.3% | Needs mocking for Clerk OTP branches |
| **Customer Profile API** | `src/app/api/users/profile/route.ts` | 92.0% | 85.0% | 100% | 91.5% | Comprehensive GET/PATCH unit tests |
| **Validation Schemas** | `src/lib/validation/name-validation.ts` | 87.5% | 82.1% | 85.7% | 90.6% | Covers Unicode Indian scripts & phone regex |
| **Rate Limiter** | `src/lib/rate-limiter.ts` | 70.4% | 57.1% | 66.7% | 69.2% | Window sliding & IP hashing verified |
| **Security Logger** | `src/lib/security-logger.ts` | 78.9% | 72.7% | 100% | 82.4% | Covers BOLA, XSS, and auth event types |
| **Auctions Service** | `src/features/auctions/services/auction-store.ts` | 83.3% | 75.0% | 66.7% | 83.3% | Validates bid increments & expiry |
| **Product Card** | `src/features/marketplace/components/product-card.tsx` | 69.4% | 45.6% | 50.0% | 68.6% | Covers price badges & craft tags |
| **Notifications Service** | `src/features/notifications/notification-service.ts` | 60.7% | 51.4% | 50.0% | 67.3% | Unread counts & role filters tested |
| **Order Service** | `src/features/orders/order-service.ts` | 42.0% | 33.3% | 33.3% | 45.0% | Needs tests for Clerk ID fallback |
| **I18n Translation Hook** | `src/core/hooks/use-translation.ts` | 100% | 100% | 100% | 100% | Full coverage on key lookup & interpolation |
| **Categories Data** | `src/lib/categories.ts` | 100% | 100% | 100% | 100% | Static data validation |

---

## 3. Untested Critical Paths & Gaps

While unit tests are green, the audit identified several critical flows lacking end-to-end automated coverage:

1. **End-to-End Razorpay Payment Flow:**
   - Simulated checkout with Razorpay modal is not integrated into Playwright test suites due to third-party iframe sandbox constraints.
   - Recommendation: Create a mock Razorpay payment provider for CI test runs.
2. **Concurrent Auction Bidding Stress Test:**
   - Race conditions on high-frequency bids are tested unit-level via mutex promise chains, but not under distributed HTTP load.
   - Recommendation: Add a k6 or autocannon test script verifying bid consistency.
3. **Database RLS Policy Verification:**
   - Row Level Security rules in `database/security_hardening_rls.sql` are verified by SQL review, but automated tests executing against real Supabase schemas are absent in CI.

---

## 4. Test Quality, Warnings & Flakiness

1. **Jest Asynchronous Open Handles:**
   - `Jest did not exit one second after the test run has completed... Consider running Jest with --detectOpenHandles`.
   - Cause: Active timers or Supabase client WebSocket connections lingering in background.
   - Workaround: Handled by `--forceExit` in `npm run test:unit`.
2. **Backend Python Test Environment:**
   - The virtual environment in `backend/venv` references nonexistent `/Volumes/Crucial X9/...` paths.
   - In GitHub Actions CI, tests pass because CI creates a fresh Ubuntu Python 3.12 virtualenv from scratch.
   - Local developers must recreate their local `venv`.

---

## 5. Automated CI/CD Pipeline Verification

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:
1. **Frontend Job:**
   - Node.js 20 setup with `npm ci`.
   - `npm run lint` (ESLint 9 + React Compiler rules).
   - `npm run typecheck` (`tsc --noEmit`).
   - `npm run test:unit` (Jest 16 suites).
   - Playwright Chromium install.
   - `npm run test:a11y` (Axe accessibility scan).
   - `npm run test:keyboard` (Keyboard navigation smoke test).
   - Plain-text secret scanning (`pk_live_`, `sk_live_`).
2. **Translation Job:**
   - `node scripts/check-translations.mjs` verifying 294 keys across 13 Indian locales.
3. **Backend Job:**
   - Python 3.12 setup.
   - `pip install -r requirements.txt -r requirements-dev.txt`.
   - Environment configuration validation.
   - `pytest -v` test suite.
   - FastAPI client smoke test (`/health`, `/api/forecast-demand`, `/api/search/semantic`).

All CI checks currently pass.

