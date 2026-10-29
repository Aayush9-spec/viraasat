<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Viraasat Engineering & Architectural Rules

## 1. Cinematic Heritage Design System (De-Vibe Coding Standards)
- **Palette**:
  - Heritage Red / Deep Terracotta: `#701D24` / `#8C2B2B`
  - Earth Artisan Brown: `#5E2C18`
  - Parchment & Ivory Background: `#FAF7F2` / `#F3EDE2` / `#FBF7F0`
  - Antique Brass & Warm Gold: `#C59B4B` / `#8F6826`
  - Deep Charcoal & Slate: `#221C18` / `#1E293B`
- **Strict Visual Ban**:
  - NEVER generate generic AI purple gradients (`#8b5cf6`, `from-purple-500`, `purple-600`), floating blurred neon blobs, or cartoonish AI stock clichés.
  - All UI elements must resemble physical Indian artisanal artifacts: tactile parchment borders (`#E8DCCB`), gold foil stamping (`#C59B4B`), and handcrafted warmth.
- **Typography Scale**:
  - Titles & Section Headers: `font-serif` (Playfair / Cormorant / Cinzel spirit) with tight tracking and warm editorial presence.
  - Data, Metrics & Cryptographic Hashes: `font-mono` with clear tabular numbers.
  - Body & UI Controls: `font-sans` with crisp 1.5 line height and WCAG AA contrast.

## 2. Full-Stack Feature Parity
- Every endpoint defined in `backend/app/api/v1/router.py` is actively integrated into the frontend UI:
  1. Price Prediction Regressor (`POST /api/predict-price`) -> `BusinessAdvisor` ML Price Optimizer
  2. Seasonal Demand Predictor (`GET /api/forecast-demand`) -> `ArtisanAnalyticsDashboard` & `BusinessAdvisor`
  3. Market Prediction LSTM+GBT Ensemble (`POST /api/market/predict`) -> `BusinessAdvisor` Multi-Month Forecaster
  4. Market Trends Platform Aggregates (`GET /api/market/trends`) -> `ArtisanAnalyticsDashboard` Tab 3
  5. Top Products by 3M Projection (`GET /api/market/top-products`) -> `ArtisanAnalyticsDashboard` Tab 3
  6. Two-Tower Neural Recommendations (`POST /api/recommendations`) -> Homepage (`/`) Curated Neural Shelf & `ProductDetailPage`
  7. Co-Purchase Similar Items (`GET /api/recommendations/similar/{id}`) -> `ProductDetailPage` Co-Purchase Carousel
  8. SHA-256 Provenance Ledger (`GET /api/blockchain/provenance/{id}`) -> `ProductDetailPage` Provenance Chain
  9. Mint On-Chain Provenance (`POST /api/blockchain/generate/{id}`) -> `ProductDetailPage`
  10. Cryptographic Transfer of Ownership (`POST /api/blockchain/transfer`) -> `ProductDetailPage` Ownership Transfer Dialog
  11. Review Fraud & Spam Detection (`POST /api/fraud/detect`) -> `ReviewsSection` Pre-submit Gate & Admin Console
  12. Cultural Knowledge Graph (`GET /api/knowledge-graph/search`) -> `CulturalKnowledgeGraph` interactive viewer
  13. Semantic Multilingual Search (`GET /api/search/semantic`) -> Global Navigation Search Bar
  14. MLOps Telemetry & Model Health (`GET /api/health/models`) -> Admin Console MLOps Dashboard
  15. User Behavioral Segmentation & Scoring (`POST /api/user/score`, `GET /api/user/segments`) -> Admin Console Customer Intelligence
  16. Asynchronous Retraining Pipeline (`POST /api/admin/retrain`) -> Admin Console Retrain Action
  17. Razorpay Payment Gateway & Verification (`/api/razorpay/order`, `/api/razorpay/verify`) -> `CheckoutModal`

## 3. Code Cleanliness & Mobile/APK Readiness
- Never bypass TypeScript or leave implicit any errors (`tsc --noEmit` must pass with 0 errors).
- Preserve existing database schemas and route signatures unless demonstrably broken.
- Ensure all touch targets are at least 44x44px for native mobile experience.
- Maintain PWA manifest compliance with signature terracotta brand identity.
