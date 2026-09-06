# API Endpoints Specification

This document details the REST API endpoints exposed by the Viraasat API Gateway.

All endpoints are served under the `/api/*` prefix on `http://localhost:8000` in
development (proxied to the backend by the Next.js app). Endpoints marked
**Auth** require a Clerk session token; the frontend attaches it as
`Authorization: Bearer <token>`.

Rate limiting: 30–60 requests/minute per IP depending on the endpoint (see
`backend/app/api/router.py`).

---

## AI & Search

### 1. Price Predictor
*   **Path**: `/api/predict-price`
*   **Method**: `POST`
*   **Payload**:
    ```json
    {
      "category": "Home Decor",
      "material": "Multani Mitti & Quartz",
      "labor_hours": 12.0,
      "size_sqft": 1.5,
      "is_organic": true
    }
    ```
*   **Response**: `recommended_price`, `price_range {min, max}`, and cost
    breakdown metrics.

### 2. Demand Forecaster
*   **Path**: `/api/forecast-demand`
*   **Method**: `GET`
*   **Parameters**: `region` (e.g. `Rajasthan`), `category` (e.g. `Textiles`)
*   **Response**: 12-month demand time-series index plus directional warnings.

### 3. Semantic Product Search
*   **Path**: `/api/search/semantic`
*   **Method**: `GET`
*   **Parameters**: `q` (free-text query, e.g. `blue pottery`)
*   **Response**: ranked `results` scored against the product catalog
    (whole-query + token matches across name/category/region, boosted by
    knowledge-graph label relationships). Each result carries
    `{ id, name, category, region, price, score, matched_in }`.

### 4. Knowledge Graph
*   **Path**: `/api/knowledge-graph/search`
*   **Method**: `GET`
*   **Parameters**: `query` (e.g. `Mithila`)
*   **Response**: subgraph nodes, relationship edges, centrality ranking, and
    GI certification paths.

---

## Provenance Ledger

### 5. Get Provenance
*   **Path**: `/api/blockchain/provenance/{productId}`
*   **Method**: `GET`
*   **Auth**: required
*   **Response**: the full ledger chain of provenance blocks plus an
    authenticity score and verification status.

### 6. Transfer Ownership
*   **Path**: `/api/blockchain/transfer`
*   **Method**: `POST`
*   **Auth**: required (role `artisan` or `admin`)
*   **Parameters**: `product_id`, `new_owner`, `tx_value`
*   **Response**: `{ status, block_added }` for the mined transfer block.

---

## Trust & Safety

### 7. Image Moderation
*   **Path**: `/api/moderate-image`
*   **Method**: `POST` (multipart `file`)
*   **Auth**: required (role `artisan` or `admin`; dev tokens may bypass)
*   **Pipeline**: MIME + size validation → offline CSAM perceptual-hash check
    (`CSAM_HASH_ENABLED`) → Google Cloud Vision SafeSearch
    (`GOOGLE_CLOUD_VISION_ENABLED`). Blocks with `allow: false` on violations;
    returns a soft pass (`safe_search_disabled`) when Vision is off. Fail-closed
    on pipeline errors. See `docs/csam-compliance.md`.

### 8. Review Fraud Detection
*   **Path**: `/api/fraud/detect`
*   **Method**: `POST`
*   **Auth**: required (role `admin` or `artisan`)
*   **Payload**: `ReviewAnomalyInput { seller_id, reviewer_id, rating, review_text }`
*   **Response**: `{ is_fraudulent, ... }` anomaly verdict.

---

## Frontend-only routes (Next.js app router)

These live in `frontend/src/app/…` and do **not** touch the Python gateway
(auth handled by Clerk):

| Route | Purpose |
| --- | --- |
| `POST/PUT /api/razorpay` | Create a Razorpay order; `PUT` verifies signature (client-facing, no user secrets) |
| `POST /api/razorpay/webhook` | HMAC-verified payment confirmation, redirected to order confirmation |
| `GET /api/recommendations` | AI-backed product recommendations (JWT-protected) |

## Health

*   `GET /health` — liveness probe (no auth).