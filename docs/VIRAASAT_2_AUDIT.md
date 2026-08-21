# Viraasat 2.0 — Feature Audit & Gap Analysis

This document serves as the Phase 1 audit of the Viraasat prototype repository. Every major architectural domain and feature has been evaluated and classified according to the following matrix:

- **REAL**: Production-ready, connected to real data, scalable.
- **PARTIALLY IMPLEMENTED**: Functional but missing critical links (e.g., UI exists but no backend, or real backend but not connected to UI).
- **SIMULATED**: Hardcoded algorithms designed to mimic ML/AI behavior without actual models or training.
- **MOCK**: Static data structures used to populate UIs; no underlying logic.
- **MISSING**: Documented or planned, but completely absent from the codebase.

---

## 1. Frontend & Routing (Next.js App Router)
- **App Router Architecture** (`src/app`): **REAL**. The modular Next.js structure is solid, using layouts and dynamic routing.
- **Marketplace Pages** (`/shop`, `/product/[id]`): **PARTIALLY IMPLEMENTED**. The UI is built, but it relies on static mock data (`src/lib/data.ts`) rather than querying the database.
- **Artisan Dashboard** (`/dashboard/artisan`): **PARTIALLY IMPLEMENTED**. Contains forms that push to Firebase, but data isn't synchronized with the main buyer marketplace.
- **Static Content Pages** (`/journal`, `/artisans`, `/faq`): **MISSING**. Links exist in the footer/nav, but routes are absent resulting in 404s.

## 2. Authentication & Security
- **Clerk Authentication**: **PARTIALLY IMPLEMENTED**. The Clerk `<SignInButton>` and middleware are present, but user metadata is not synced with Firestore (the dashboard uses hardcoded IDs like `artisan-1`).
- **Firebase Security Rules**: **MISSING**. Firestore is initialized, but there are no custom security rules defined in the repo protecting read/writes.
- **FastAPI Authentication**: **MISSING**. Python backend endpoints are entirely unprotected.

## 3. Database & Storage
- **Firebase Firestore**: **PARTIALLY IMPLEMENTED**. Setup exists in `src/lib/firebase.ts`. It is used only for writes in the artisan dashboard, not for reads in the marketplace.
- **Firebase Storage**: **PARTIALLY IMPLEMENTED**. Hooked up for image uploads in product forms, but lacks comprehensive usage across the site.
- **Knowledge Graph Database**: **SIMULATED**. Relies on a local `knowledge_graph.json` file traversed via basic python loops instead of a real Graph DB like Neo4j or ArangoDB.

## 4. AI & Machine Learning Features
- **Pricing Recommendation Engine** (`backend/ai/pricing.py`): **SIMULATED**. Uses static if-else logic, base rates, and hardcoded multipliers based on material instead of real regression models.
- **Demand Forecasting** (`backend/ai/forecasting.py`): **SIMULATED**. Returns static arrays with `random.uniform()` noise to mimic an LSTM/Prophet model.
- **AI Chatbot / Genkit** (`src/ai/flows/chat.ts`): **PARTIALLY IMPLEMENTED**. The Genkit infrastructure is present and connects to Gemini, but falls back to static string replacement simulation when the API is unreachable or rate-limited.
- **Fraud & Anomaly Detection** (`backend/ai/fraud.py`): **SIMULATED**. Mimics an Isolation Forest algorithm using basic keyword matching (e.g., "discount", "cheap") and length checks.
- **Provenance Ledger / Blockchain** (`backend/ai/blockchain.py`): **MOCK**. Uses Python dictionaries and `os.urandom()` to pretend blocks are being mined.
- **Image Enhancement / Vision API**: **MISSING**. Described in blueprints, but no actual Cloud Vision API integration exists.
- **Voice-to-Text Processing**: **MISSING**. Described in blueprints, but not implemented.

## 5. Payments & Transactions
- **Razorpay Integration**: **PARTIALLY IMPLEMENTED**. The checkout page hits `http://localhost:8000` (FastAPI) instead of the existing Next.js API route (`/api/razorpay`). On success, it shows a browser `alert()` instead of routing to a proper success page.

## 6. API Services
- **FastAPI Gateway** (`backend/main.py`): **REAL**. The Python REST API is properly structured with routers, but endpoints primarily serve simulated AI data.
- **Next.js API Routes** (`src/app/api`): **PARTIALLY IMPLEMENTED**. Exists for Razorpay but is currently bypassed by the frontend.

---

### Conclusion for Viraasat 2.0
The immediate priority for Viraasat 2.0 is transitioning the **SIMULATED** Python scripts into actual Scikit-learn/TensorFlow models, connecting the **PARTIALLY IMPLEMENTED** Next.js UI to Firestore (replacing mock data), and enforcing a cohesive Clerk/Firebase auth pipeline.
