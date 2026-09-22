<div align="center">

<img src="https://viraasat-eta.vercel.app/icon-192.png" alt="Viraasat logo" width="96" />

# 🪔 Viraasat

**The AI-Driven Marketplace for India's Traditional Artisans**

> *Preserve the heritage. Empower the artisans. Inspire the world.*

[![Live App](https://img.shields.io/badge/App-viraasat--eta.vercel.app-blue?logo=vercel&logoColor=white)](https://viraasat-eta.vercel.app)
[![Backend](https://img.shields.io/badge/API-FastAPI%20on%20Render-009688?logo=fastapi&logoColor=white)](https://viraasat-backend-f0c1.onrender.com/health)
[![CI](https://img.shields.io/github/actions/workflow/status/Aayush9-spec/viraasat/ci.yml?label=CI&logo=github)](https://github.com/Aayush9-spec/viraasat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## 📑 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution--ai-first-empowerment)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Running Tests](#running-tests)
  - [Production Deployment](#production-deployment)
- [Security & Secrets](#-security--secrets)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🛑 The Problem

India is home to over **7 million artisans** whose craft carries centuries of cultural memory. Yet most remain invisible to global buyers because of:

| Challenge | Real-World Impact |
|---|---|
| **Poor digital content** | Phone photos with bad lighting fail to attract premium buyers |
| **Language barriers** | Artisans cannot write compelling English product descriptions |
| **Tech intimidation** | Complex e-commerce onboarding scares away non-technical creators |
| **Lost provenance** | The cultural story and authenticity of each piece remain untold |
| **Pricing blind spots** | No data-driven guidance → artisans under-price or over-stock |

**Result:** Priceless craftsmanship stays undervalued, heritage fades, and livelihoods suffer.

---

## 💡 Our Solution — AI-First Empowerment

Viraasat collapses the gap between artisan and buyer with a **zero-friction AI pipeline**:

### For Artisans
- 📸 **AI image enhancement** (Google Cloud Vision) — turn a phone photo into a studio-quality listing
- 🗣 **Voice-to-text** (Google Speech-to-Text) — describe products in any language
- ✍️ **Gemini-refined copy** — SEO-ready, emotionally resonant product narratives generated instantly
- ⛓ **Blockchain provenance** — every product gets an immutable Proof-of-Work certificate of authenticity
- 📊 **ML pricing & demand forecasting** — scikit-learn models suggest fair prices and optimal stock timing
- 🛡 **Fraud detection** — anomaly scoring flags suspicious listings before they go live

### For Buyers
- 👤 **"Meet the Creator"** profiles with rich cultural context
- 🔍 **AI product analyser** — feature extraction, styling tips, authenticity cues
- ❤️ **Wishlist** — localStorage + Firestore sync across devices
- 🛒 **Secure cart, checkout** (Razorpay), and order tracking
- 🗺 **Knowledge-graph discovery** — explore regional crafts, GI tags, and related traditions

---

## 🌐 Live Demo

| Environment | URL |
|---|---|
| **Frontend (Vercel)** | https://viraasat-eta.vercel.app |
| **Backend health (Render)** | https://viraasat-backend-f0c1.onrender.com/health |
| **API docs (Swagger)** | https://viraasat-backend-f0c1.onrender.com/docs |

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Radix UI |
| **Auth** | Clerk (frontend session + backend JWT verification) |
| **AI orchestration** | Genkit + Google Gemini 1.5 Flash/Pro |
| **Backend** | Python 3.12, FastAPI, Uvicorn, slowapi (rate limiting) |
| **Database** | Firebase Firestore (users, products, orders), SQLite (blockchain ledger, KG cache) |
| **Storage** | Firebase Storage (product images, KYC docs) |
| **ML / AI** | scikit-learn (pricing, fraud, demand forecasting), NetworkX (cultural knowledge graph) |
| **Payments** | Razorpay (orders + HMAC-verified webhooks) |
| **Observability** | Sentry (frontend + backend) |
| **PWA** | Custom versioned service worker (precache + stale-while-revalidate) |
| **CI** | GitHub Actions (lint, typecheck, Jest, pytest, Playwright a11y) |

---

## 🏗 System Architecture

```
                 ┌─────────────────────────────────────────┐
                 │           Browser / PWA                 │
                 │  Next.js 16 · React 19 · Clerk · SW     │
                 └──────────────┬──────────────────────────┘
                                │  Clerk session JWT
               ┌────────────────┼──────────────────┐
               │                │                  │
               ▼                ▼                  ▼
        Firebase Auth      Firestore          FastAPI (Render)
        + Storage          (security rules)   ├─ Pricing ML
                           (composite idx)    ├─ Demand forecast
                                              ├─ Fraud detection
                                              ├─ Knowledge graph
                                              ├─ Provenance ledger
                                              └─ slowapi + Sentry
                      ▲
                      │  Razorpay webhooks (HMAC-verified)
                 ┌────┴───────┐
                 │  Razorpay  │
                 └────────────┘
```

**Data-flow summary**

| Flow | Path |
|---|---|
| Product writes | Client → Firestore (security rules enforced) |
| Heavy AI / ML | Client → FastAPI (Render) → response |
| Payments | Razorpay → `/api/razorpay/webhook` (HMAC) → Firestore |
| Auth sync | Clerk webhook → `/api/webhooks/clerk` → Firestore user doc |

---

## 🗂 Project Structure

```
viraasat/
├── frontend/                     # Next.js 16 application
│   ├── src/
│   │   ├── app/                  # App Router pages + /api routes
│   │   │   ├── shop/             # Product catalogue + filtering
│   │   │   ├── product/[id]/     # PDP with AI analyser
│   │   │   ├── dashboard/        # Artisan studio
│   │   │   ├── checkout/         # Cart → Razorpay
│   │   │   ├── admin/            # Moderation dashboard
│   │   │   └── api/              # Edge / Node.js API handlers
│   │   ├── components/           # Shared UI (Radix + Tailwind)
│   │   ├── features/             # Feature-scoped modules
│   │   │   ├── marketplace/      # Product listing + search
│   │   │   ├── artisan/          # Creator profiles + apply flow
│   │   │   ├── cart/             # Cart state + Razorpay integration
│   │   │   ├── orders/           # Order history + tracking
│   │   │   ├── payments/         # Payment flows
│   │   │   ├── recommendations/  # Personalised picks
│   │   │   ├── analytics/        # Artisan analytics
│   │   │   └── ai/               # Client-side AI utilities
│   │   ├── ai/                   # Genkit flows (chat, vision, RAG)
│   │   ├── lib/                  # auth, firebase, pwa, backend client
│   │   ├── hooks/                # Custom React hooks
│   │   └── types/                # Shared TypeScript types
│   ├── public/
│   │   ├── sw.js                 # Versioned service worker (build-injected)
│   │   └── manifest.json         # PWA manifest
│   └── scripts/build-sw.js      # Rewrites sw.js CACHE_NAME per build
│
├── backend/                      # FastAPI service
│   ├── main.py                   # App factory, CORS, Sentry, slowapi
│   ├── app/
│   │   ├── api/                  # Routers + Clerk JWT auth deps
│   │   └── services/             # Storage layer (SQLite / Firestore / memory)
│   ├── ai/                       # ML models + knowledge graph + blockchain
│   └── tests/                    # pytest suite (in-memory store)
│
├── firebase/                     # Security rules + deploy config
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
│
├── database/                     # Seed JSON + trained .pkl models
├── docs/                         # Architecture, deployment, secrets guide
├── .github/
│   ├── workflows/ci.yml          # CI pipeline
│   ├── ISSUE_TEMPLATE/           # Bug & feature templates
│   └── PULL_REQUEST_TEMPLATE.md  # PR checklist
└── run_all_viraasat.sh           # Local dev orchestrator
```

---

## ⚙️ Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js + npm | 20+ |
| Python | 3.12+ |
| Firebase CLI | latest (`npm i -g firebase-tools`) |
| Git | any recent |

Accounts needed: **Clerk**, **Firebase / Google Cloud**, **Google AI Studio** (Gemini key), **Razorpay**, **Sentry** (optional).

---

### Environment Variables

Copy the example files and fill in your credentials:

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

<details>
<summary><b>Frontend <code>.env.local</code> keys</b></summary>

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

GEMINI_API_KEY=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SENTRY_DSN=...   # optional
```

</details>

<details>
<summary><b>Backend <code>.env</code> keys</b></summary>

```env
CLERK_SECRET_KEY=sk_test_...
ALLOWED_ORIGINS=http://localhost:9002
REQUIRE_AUTH=false            # set true in production

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

FIREBASE_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json   # optional

DATABASE_URL=                 # leave blank for local SQLite
SENTRY_DSN=...                # optional
```

</details>

---

### Local Development

```bash
# 1. Clone
git clone https://github.com/Aayush9-spec/viraasat.git
cd viraasat

# 2. Frontend deps
cd frontend
npm install --legacy-peer-deps
cd ..

# 3. Backend deps
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 4. Deploy Firebase rules (one-time; requires firebase login)
firebase login
firebase use --add <YOUR_FIREBASE_PROJECT_ID>
firebase deploy --only firestore:rules,firestore:indexes,storage

# 5. Start both services
./run_all_viraasat.sh
# Frontend → http://localhost:9002
# Backend  → http://localhost:8000  (Swagger: /docs)
```

---

### Running Tests

```bash
# Frontend — lint, typecheck, Jest unit tests
cd frontend
npm run lint
npm run typecheck
npm run test:unit

# Playwright accessibility + keyboard smoke tests
npx playwright install --with-deps chromium
npm run test:a11y
npm run test:keyboard

# Backend — pytest (uses in-memory store; never touches production data)
cd ../backend
source venv/bin/activate
python -m pytest -v
```

All suites run automatically on every push via `.github/workflows/ci.yml`.

---

### Production Deployment

| Service | Platform | Notes |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Set all `NEXT_PUBLIC_*`, `GEMINI_API_KEY`, `CLERK_*`, `RAZORPAY_*`, `CLERK_WEBHOOK_SECRET` env vars in the Vercel dashboard |
| **Backend** | [Render](https://render.com) | Set `ALLOWED_ORIGINS`, `CLERK_*`, `RAZORPAY_*`, `SENTRY_DSN`, `REQUIRE_AUTH=true` |
| **Firebase** | Firebase Console | `firebase deploy --only firestore:rules,firestore:indexes,storage` |
| **Razorpay** | Dashboard | Webhook URL: `https://YOUR_DOMAIN/api/razorpay/webhook` |

---

## 🔒 Security & Secrets

⚠️ **Previously committed env files have been removed from history.** Treat every key that was ever committed as compromised and rotate them before launch.

See [`docs/secrets.md`](docs/secrets.md) for the full checklist.

**Hard rules:**

- Never commit `.env` or `.env.local`. Both are `.gitignore`d; templates live in `*.example`.
- Set `REQUIRE_AUTH=true` and a strict `ALLOWED_ORIGINS` in every non-development environment.
- All incoming webhooks (`/api/razorpay/webhook`, `/api/webhooks/clerk`) verify HMAC signatures before trusting the payload.
- To report a vulnerability, please read [`SECURITY.md`](SECURITY.md).

---

## 🛣 Roadmap

### ✅ Shipped
- [x] Artisan KYC & application flow
- [x] Product listings, search, filtering, category pages (7 categories)
- [x] AI-powered image enhancement + listing copy generation
- [x] Blockchain provenance certificate per product
- [x] ML pricing & demand-forecast models
- [x] Fraud-detection scoring
- [x] Razorpay checkout + HMAC-verified webhooks
- [x] Order history & tracking
- [x] Wishlist (localStorage + Firestore sync)
- [x] Product reviews with aggregate ratings
- [x] "Meet the Creator" artisan profiles
- [x] Admin moderation dashboard (`/admin`)
- [x] Full legal pages (ToS, Privacy, Refund, Shipping, FAQ)
- [x] Journal / editorial content
- [x] PWA with versioned service worker
- [x] CI pipeline (lint, typecheck, Jest, pytest, Playwright a11y)

### 🔜 Coming Next
- [ ] Real-time buyer ↔ artisan chat with abuse detection
- [ ] i18n for artisan flows (Hindi, Tamil, Bengali)
- [ ] Multi-region Render workers with Redis-backed rate limits
- [ ] GI-tag certification badge with third-party verification
- [ ] Mobile app (React Native / Expo)

---

## 🤝 Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a PR.

1. Fork the repo and create your branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests where appropriate
3. Ensure `npm run lint && npm run typecheck && npm run test:unit` pass
4. Open a pull request — the template will guide you through the checklist

---

## 📄 License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Google Firebase](https://firebase.google.com) — data layer & storage
- [Google AI / Gemini](https://ai.google.dev) — language & vision intelligence
- [Clerk](https://clerk.com) — frictionless authentication
- [Razorpay](https://razorpay.com) — payment infrastructure
- [Vercel](https://vercel.com) & [Render](https://render.com) — hosting
- The artisans of India who inspire every line of this code 🪔

---

<div align="center">

**Handcrafted stories deserve a global audience. 🌍✨**

Built with ❤️ by [Aayush Kumar Singh](https://github.com/Aayush9-spec) and contributors

</div>
