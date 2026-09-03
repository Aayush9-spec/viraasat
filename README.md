# 🪔 Viraasat – The AI-Driven Marketplace for Local Artisans

> **Preserve the heritage. Empower the artisans. Inspire the world.**

**Viraasat** (Heritage) is an AI-powered digital marketplace that bridges India's traditional artisans with a global audience. We use **Google AI (Gemini, Cloud Vision, Speech-to-Text)** and a serverless data layer (Firebase + FastAPI) to turn a phone photo and a voice memo into a professionally listed, blockchain-provenanced product.

---

## 📑 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution-ai-first-empowerment)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Production Deployment](#production-deployment)
- [Security & Secrets](#-security--secrets)
- [License](#-license)

---

## 🛑 The Problem

| Challenge | Impact |
| --- | --- |
| **Poor digital content** | Bad lighting and low-quality photos fail to attract premium buyers. |
| **Language barriers** | Inability to write compelling English descriptions limits reach. |
| **Tech intimidation** | Complex e-commerce onboarding scares away non-technical creators. |
| **Lost stories** | The cultural significance and effort behind the craft remain untold. |

**Result:** Priceless craftsmanship remains undervalued, and heritage fades.

---

## 💡 Our Solution: AI-First Empowerment

### For artisans
- **AI image enhancement** (Google Cloud Vision) to turn phone photos into studio-quality listings.
- **Voice-to-text** (Google Speech-to-Text) so artisans can describe products in their own language.
- **AI-refined copy** (Vertex AI / Gemini) for SEO-ready, emotional narratives.
- **Blockchain provenance** for every product (custom Proof-of-Authority ledger).
- **ML-based pricing & demand forecasting** to suggest fair prices and stock at the right time.

### For buyers
- "Meet the Creator" profiles with cultural context.
- AI product analyzer (feature extraction, styling tips, authenticity cues).
- Secure cart, checkout (Razorpay), and order tracking.
- Knowledge-graph-powered discovery of regional crafts and GI tags.

---

## 🛠 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Radix UI, Clerk auth |
| **AI orchestration** | Genkit + Google Gemini |
| **Backend** | Python 3.12, FastAPI, Uvicorn, slowapi (rate limiting), Sentry |
| **Auth** | Clerk (frontend session + backend JWT verification) |
| **Database** | Firebase Firestore (users, products, orders), SQLite (blockchain ledger, knowledge graph cache) |
| **Storage** | Firebase Storage (product images, KYC docs) |
| **ML / AI** | scikit-learn (pricing, fraud, demand forecasting), NetworkX (cultural knowledge graph) |
| **Payments** | Razorpay (orders + webhooks) |
| **Observability** | Sentry (FE + BE) |
| **PWA** | Custom service worker (precache, stale-while-revalidate, versioned) |

---

## 🏗 System Architecture

```
                ┌─────────────────────────────────────────┐
                │              Browser (PWA)             │
                │   Next.js 16 • React 19 • Clerk • SW    │
                └──────────────┬──────────────────────────┘
                               │ Clerk session JWT
              ┌────────────────┼─────────────────┐
              │                │                 │
              ▼                ▼                 ▼
       Firebase Auth     Firestore (rules)   FastAPI (Render)
       + Storage         (composite indexes)  • Pricing ML
                                              • Forecasting
                                              • Fraud detect
                                              • Knowledge graph
                                              • Provenance ledger
                                              • Rate-limited
                                              • Sentry-instrumented
                              ▲
                              │ Razorpay webhooks
                              │
                        ┌─────┴──────┐
                        │  Razorpay  │
                        └────────────┘
```

- **Serverless writes** (products, orders, reviews) go through Firestore with security rules.
- **Heavy AI / ML** (pricing, forecasting, KG, blockchain) is offloaded to FastAPI on Render.
- **Payments** are confirmed via Razorpay webhooks (HMAC-verified) hitting the Next.js API route.
- **Auth sync**: Clerk `user.created` / `user.updated` webhooks materialize matching Firestore user docs.

---

## 🗂 Project Structure

```text
viraasat/
├── frontend/                # Next.js 16 app
│   ├── src/
│   │   ├── app/             # App Router pages + /api routes
│   │   ├── components/      # Reusable UI (Radix + Tailwind)
│   │   ├── features/        # Feature-scoped modules
│   │   ├── ai/              # Genkit flows (chat, vision, rag)
│   │   ├── lib/             # auth, firebase, pwa, backend client
│   │   ├── hooks/           # custom React hooks
│   │   └── types/           # shared TypeScript types
│   ├── public/
│   │   ├── sw.js            # versioned service worker (build-injected)
│   │   └── manifest.json
│   ├── scripts/build-sw.js  # rewrites sw.js CACHE_NAME per build
│   └── eslint.config.mjs    # ESLint 9 flat config (Next 16)
│
├── backend/                 # FastAPI service
│   ├── main.py              # app factory, CORS, Sentry, slowapi
│   ├── app/
│   │   ├── api/             # router + auth deps (Clerk JWT)
│   │   └── services/        # storage layer (SQLite / Firestore / memory)
│   └── ai/                  # ML models + knowledge graph + blockchain
│
├── firebase/                # security rules + deploy config
│   ├── firebase.json
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
│
├── database/                # seed JSON + trained .pkl models
├── docs/                    # architecture, deployment, secrets
├── scripts/                 # firebase deploy helper
└── run_all_viraasat.sh      # local dev orchestrator
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **Python 3.12+**
- **Firebase CLI**: `npm install -g firebase-tools`
- Accounts: **Clerk**, **Firebase**, **Google AI Studio**, **Razorpay**, **Sentry** (optional)

### Local Development

```bash
# 1. Clone
git clone https://github.com/Aayush9-spec/viraasat_.git
cd viraasat_

# 2. Frontend
cd frontend
cp .env.example .env.local      # fill in test values
npm install --legacy-peer-deps
cd ..

# 3. Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # fill in test values
cd ..

# 4. Firebase rules (one-time, requires firebase login)
firebase login
firebase use --add <PROJECT_ID>
firebase deploy --only firestore:rules,firestore:indexes,storage

# 5. Run both services
./run_all_viraasat.sh
# Frontend: http://localhost:9002
# Backend:  http://localhost:8000  (docs at /docs)
```

### Production Deployment

See [`docs/deployment.md`](docs/deployment.md).

- **Frontend** → Vercel. Set all `NEXT_PUBLIC_*`, `GEMINI_API_KEY`, `CLERK_*`, and `NEXT_PUBLIC_BACKEND_URL` env vars. `npm run build` runs `prebuild` automatically (injects SW build id).
- **Backend** → Render Web Service. Root directory `backend/`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `ALLOWED_ORIGINS`, `CLERK_*`, `RAZORPAY_*`, `SENTRY_DSN`, `DATABASE_URL`.
- **Firebase** → run `firebase deploy --only firestore:rules,firestore:indexes,storage`.
- **Razorpay** → add webhook `https://YOUR_DOMAIN/api/razorpay/webhook` with events `payment.captured`, `payment.failed`, `refund.processed`. Set `RAZORPAY_WEBHOOK_SECRET` in Vercel.

---

## 🔒 Security & Secrets

> ⚠️ **All previously committed env files have been removed.** Treat every key in the git history as compromised. Rotate Clerk, Firebase, Gemini, and Razorpay keys before launch.

See [`docs/secrets.md`](docs/secrets.md) for the full setup checklist, including which env var goes where (Vercel vs Render) and what to do if a key leaks.

Key rules:
- Never commit `.env` or `.env.local`. Both are gitignored; templates are in `*.example`.
- Set `REQUIRE_AUTH=true` and `ALLOWED_ORIGINS` in **every** non-development environment.
- Use `DATABASE_URL=firestore://PROJECT_ID` to share the ledger across multiple Render workers.
- Webhooks (`/api/razorpay/webhook`, `/api/webhooks/clerk`) verify HMAC signatures before trusting the body.

---

## 🛣 Roadmap

- [ ] ToS / Privacy / Refund pages
- [ ] Image moderation on artisan uploads
- [ ] Real-time chat (buyer ↔ artisan) with abuse guard
- [ ] Multi-region Render workers with Redis-backed rate limits
- [ ] i18n for artisan flows (Hindi, Tamil, Bengali)

---

## 🙏 Acknowledgements

- **Google Firebase** for the data layer.
- **Google AI / Gemini** for the intelligence layer.
- **Clerk** for frictionless auth.
- **The artisans** who inspire this work.

---

<p align="center">
<b>Handcrafted stories deserve a global audience. 🌍✨</b>
<br />
Built with ❤️ by Aayush Kumar Singh and Team
</p>
