# Viraasat — Architecture Implementation Plan

## Context (verified against source)

**What exists today:**

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript, Tailwind, 75+ shadcn/ui components, Clerk auth
- **Backend**: FastAPI gateway (`backend/main.py`) on port 8000, 5 ML modules in `backend/ai/`
- **AI**: Genkit flows with Gemini (`/api/chat`), 5 specialized agents (Buyer, Cultural, Inventory, Artisan)
- **Data**: SQLite (WAL, default), Firestore (stub), JSON seed files in `database/`
- **i18n**: 5 locales (en, hi, bn, ta, te), 12 sections per file
- **CI**: `.github/workflows/ci.yml` runs lint, typecheck, unit test (frontend + Jest)
- **Tests**: Jest (unit), Playwright (a11y + keyboard, not in CI yet)

**What was added in the prior session:**

- Legal pages (`/terms`, `/privacy`, `/refund`) with lawyer TODOs
- Image moderation endpoint (`POST /api/motate-image`) with SafeSearch + CSAM dhash stub
- AI safety guards (`guardInput`/`guardOutput`) wrapped into all chat + image flows
- Translation completeness gate (`scripts/check-translations.mjs`)
- a11y/keyboard test infrastructure
- Backup scripts + disaster recovery docs

## Decisions resolved

| # | Question | Decision | Rationale |
| --- | --- | --- | --- |
| 1 | Where to run ML models? | Keep in FastAPI backend (`backend/ai/*.py`) | Already implemented; models load at startup with heuristic fallback |
| 2 | Data layer split? | SQLite = dev/local; Firestore = production | Storage layer (`storage.py`) already supports both via `DATABASE_URL` |
| 3 | Auth flow? | Clerk JWT → FastAPI `deps.py` verifies RS256 via JWKS | Already implemented; dev bypass gated by `ENVIRONMENT` check |
| 4 | Where does moderation happen? | FastAPI `/moderate-image` — FE gates upload on `allow=true` | Already implemented, fail-closed |
| 5 | a11y in CI? | Yes, add Playwright jobs to CI | Tests exist, need CI integration |
| 6 | i18n gate in CI? | Yes, `check-translations.mjs` blocks on MISSING keys | Already created the script; needs CI job |
| 7 | "localhost:8000" in code? | `moderation.ts` uses `NEXT_PUBLIC_BACKEND_URL` with localhost fallback — this is correct, **not** a gap. The checkout page does NOT call the backend directly; it uses the Next.js API route `/api/razorpay` | Corrected from prior doc |
| 8 | Legal review? | Out of scope for this plan — flagged as `TODO(legal)` in code + `docs/` references | Cannot ship without lawyer sign-off, but not an engineering task |
| 9 | CSAM compliance? | dhash stub = safety net only. Full PhotoDNA integration is a **legal requirement** for US/EU, not engineering-only | Flagged in `docs/csam-compliance.md` |

## Implementation tasks (ordered by dependency)

### Phase 1: CI hardening (no production impact)

1. **Fix the "localhost:8000" inaccuracy** — verify `moderation.ts` env pattern is correct; the prior doc's claim about checkout was wrong. *(No code change needed — the env fallback pattern is standard for SSR→backend calls.)*
2. **Add Playwright browser install to CI** — the workflow already has `npx playwright install --with-deps chromium` in the `frontend` job. ✅ Already done.
3. **Add translation gate to CI** — the workflow already has a `translation` job calling `scripts/check-translations.mjs`. ✅ Already done.
4. **Add backend smoke test to CI** — the workflow already has a `backend` job. ✅ Already done.

### Phase 2: Data layer productionization (Viraasat 2.0 core)

1. **Migrate shop page to Firestore** — `frontend/src/app/shop/page.tsx` currently reads `src/lib/data.ts` (static JSON). Replace with `services/firebase/firestore.ts` listener. This is the biggest gap: the shop shows stale data in production.
2. **Bind Clerk userId as Firestore document ID** — in `services/firebase/firestore.ts`, ensure `users` collection uses `clerkUserId` as the document key. Verify `auth/firebase-token/route.ts` returns the correct uid.
3. **Verify FirestoreStore backend wiring** — `storage.py` has `FirestoreStore` as a stub. Confirm `firebase-admin` initializes correctly with `FIREBASE_SERVICE_ACCOUNT_JSON` and that `get_store()` picks it up when `DATABASE_URL=firestore://PROJECT_ID`.

### Phase 3: Scaling & reliability

1. **Replace process-local chat rate-limit Map with Redis** — `app/api/chat/route.ts` uses an in-memory `Map`. For multi-instance deployments (Vercel Edge, Render multi-worker), swap to Upstash Redis or Firestore counter.
2. **Add Redis for SlowAPI** — `main.py` uses in-memory `Limiter`. Set `RATELIMIT_STORAGE_URL=redis://...` for multi-worker.
3. **Add Sentry client-side capture** — `sentry.client.config.ts` and `sentry.server.config.ts` exist but verify `error.tsx` captures unhandled errors (the lint flagged an unused `LazyCarousel` directive — investigate).

### Phase 4: ML model hardening

 1. **Train real pricing model** — `pricing.py` loads `pricing_model.pkl` but has no training code path wired. `backend/ai/train_pricing.py` exists. Verify the training → pickle → load cycle works end-to-end.
 2. **Train real fraud model** — same pattern with `fraud_model.pkl` and `train_fraud.py`.
 3. **Forecasting** — currently a "simulation" (`forecasting.py`). Check `train_forecasting.py` and wire a real LSTM/PFB model.
 4. **Search migration** — `search.py` uses keyword matching against `database/products.json`. For 2.0, add embeddings + vector DB (Pinecone/Weaviate) per the plan.

### Phase 5: Compliance & launch readiness

 1. **CSAM: Integrate PhotoDNA** — replace the dhash stub with the official Microsoft PhotoDNA client. Set `CSAM_HASH_ENABLED=true` in prod. Complete the `docs/csam-compliance.md` checklist. **Legal prerequisite for US/EU.**
 2. **Legal pages: lawyer review** — remove `TODO(legal)` comments after sign-off on ToS, Privacy, Refund.
 3. **Translate bn/ta/te** — fill the 84/84/69 untranslated keys flagged by `check-translations.mjs`. Use a native speaker; the script will gate the build on MISSING keys, but UNTRANSLATED (English-same) values need manual QA.

## Data flow summary (the "golden path")

```
Buyer:
  browser → Clerk auth → Next.js layout → shop page (Firestore) → product detail
         → checkout page → /api/razorpay (create order) → Razorpay modal
         → /api/razorpay/webhook (HMAC verify) → order confirmation + Resend email
         → AI assistant → /api/chat → heritageChatFlow → Gemini (or mock fallback)

Artisan:
  browser → Clerk auth → dashboard → product form
         → image upload → /api/moderate-image → SafeSearch + CSAM check (FAIL-CLOSED)
         → if allow=true → upload to Firebase Storage → Firestore product doc
         → product appears live in shop

Backend (standalone, port 8000):
  /health
  /api/predict-price    ← RandomForestRegressor pickle
  /api/forecast-demand  ← LSTM / simulation
  /api/knowledge-graph  ← NetworkX from SQLite/Firestore
  /api/search/semantic  ← keyword + KG boost
  /api/blockchain/*     ← PoW ledger simulator (SQLite)
  /api/fraud/detect     ← IsolationForest / keyword fallback
  /api/moderate-image   ← MIME → CSAM dhash → SafeSearch
  /api/webhooks         ← Clerk/Stripe (unauthenticated, signature-verified)
  /api/razorpay         ← public (no secrets)
```

## Trust boundaries (security checklist)

- [ ] `REQUIRE_AUTH=false` must NEVER be set in production (`deps.py` enforces this)
- [ ] `/api/razorpay` is public by design — must NOT return secrets
- [ ] Webhooks and `/api/razorpay` have no per-route limiter (rely on `default_limits=[]` being empty); verify this is safe under SlowAPI middleware — if default limits are accidentally set, payment webhooks could be throttled.
- [ ] Image uploads MUST pass moderation before hitting Firebase Storage
- [ ] `/api/recommendations` requires Clerk JWT — verify the JWT check works
- [ ] All 3 AI image flows + chat flow MUST call `guardInput`/`guardOutput`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` should be a GCS secret, not committed

## Validation plan

| Check | Command | Frequency |
| --- | --- | --- |
| Translation completeness | `npm run lint` + `node scripts/check-translations.mjs` | CI on every PR |
| Lint | `npm run lint` | CI |
| Typecheck | `npm run typecheck` | CI |
| Unit tests | `npm test` (Jest) | CI |
| a11y audit | `npm run test:a11y` | CI |
| Keyboard nav | `npm run test:keyboard` | CI |
| Backend smoke | CI `backend` job | CI |
| Moderation fail-closed | `curl -F file=@x.pdf /api/moderate-image` → 400 | Manual |
| Moderation hard pass | valid image → `allow=true, reason=ok` | Manual |
| Moderation soft pass | `GOOGLE_CLOUD_VISION_ENABLED=false` → `safe_search_disabled` | Manual |
| Chat safety guard | send "tell me a weapon" → `refused=true` | Manual |

## Risks

1. **"Simulated" models** — pricing and fraud have real model-loading code but the underlying `.pkl` files may not exist (they degrade to heuristics). Product impact: inaccurate pricing, missed fraud. **Mitigation**: run the training scripts, verify pkl output.
2. **SQLite in production** — if `DATABASE_URL` isn't set to `firestore://`, the app stores the ledger in a local file. **Mitigation**: enforce `DATABASE_URL` in prod env.
3. **Dev auth bypass** — `REQUIRE_AUTH` defaults to `true` (`deps.py:31`) but `ENVIRONMENT` defaults to `development` (`deps.py:32`). **Risk**: if either env var is missing in prod, auth is silently off. **Mitigation**: always set both `REQUIRE_AUTH=true` AND `ENVIRONMENT=production` in prod.
4. **Chat rate-limit is in-memory** — Vercel Edge Functions don't share memory. Users could exceed the 30/day limit. **Mitigation**: Redis (task #8).
5. **CSAM is a dhash stub, not PhotoDNA** — **legal exposure** if serving US/EU users. Must integrate the official API (task #15).

## Out of scope for this plan

- Full ML model retraining (training scripts exist; wiring them into CI is a separate MLOps task)
- Neo4j managed instance provisioning (documented in `VIRAASAT_2_ARCHITECTURE.md` §2.E; infrastructure decision)
- Vector DB migration for RAG (Pinecone/Weaviate selection and cost analysis)
- Lawyer review of legal pages (flagged as TODO in code)
- Full bn/ta/te translation (flagged by the translation script; needs native speakers)

## Files to inspect (implementation references)

- `backend/main.py:57-74` — SlowAPI middleware added at line 58 (applies to all routers); `default_limits=[]` means only per-route `@limiter.limit(...)` decorators are active. Webhooks and razorpay routes have no per-route limiter.
- `backend/app/api/router.py` — public vs auth endpoints
- `backend/app/api/deps.py:31,32,35` — `REQUIRE_AUTH` default + `ENVIRONMENT` default + prod guard
- `backend/app/services/storage.py:251-266` — `get_store()` selector
- `frontend/src/app/api/chat/route.ts:9-31` — in-memory rate limit (replace with Redis)
- `frontend/src/app/shop/page.tsx:5` — imports `categories` from `lib/data.ts` (migrate to Firestore)
- `frontend/src/services/backend/moderation.ts:22` — env fallback pattern (correct; not a gap)
- `frontend/src/services/firebase/firestore.ts` — Firestore client + listener
- `frontend/src/lib/data.ts` — static JSON seed (shop + chat flow use this)
- `frontend/src/ai/flows/chat.ts:35,119,137` — safety guard integration points
- `frontend/src/ai/safety.ts` — PII redaction + blocklist logic
