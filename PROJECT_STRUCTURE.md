# Viraasat Platform – Developer Architecture Guide

This document provides a developer-oriented guide mapping the file structures, data routes, and component-level architecture flows of the **Viraasat** digital commerce ecosystem.

---

## 1. Modular Folder Structure

```
viraasat/
├── src/
│   ├── app/                         # 🌐 ROUTES / PAGES (Clean Next.js App Router)
│   │   ├── (auth)/                  #   - Login / Signup route wrappers
│   │   ├── admin/                   #   - Moderation & application review console
│   │   ├── artisan/                 #   - Artisan dashboard, inventory, & provenance
│   │   ├── shop/                    #   - Product marketplace listing page
│   │   ├── product/[id]/            #   - Dynamic route for single product details
│   │   ├── checkout/                #   - Razorpay transaction storefront checkout
│   │   ├── layout.tsx               #   - Root viewport container with AppProviders & AppShell
│   │   └── globals.css              #   - Tailwind global styling and theme variables
│   │
│   ├── config/                      # ⚙️ CONFIGURATION & ENVIRONMENT
│   │   ├── env.ts                   #   - Type-safe, validated environment variables with fallbacks
│   │   ├── site.ts                  #   - Site-wide navigation links, social handles, metadata
│   │   ├── constants.ts             #   - Central constants (Storage keys, roles, currencies)
│   │   └── index.ts                 #   - Barrel export
│   │
│   ├── services/                    # 🔌 SERVICES & API CLIENTS
│   │   ├── api/                     #   - Centralized typed API client (products, orders, users, AI)
│   │   ├── backend/                 #   - Python FastAPI service client
│   │   ├── firebase/                #   - Firestore, Storage, and Auth client drivers
│   │   └── supabase.ts              #   - Supabase client singleton
│   │
│   ├── features/                    # 🧩 BUSINESS FEATURES (Scoped Modules)
│   │   ├── artisan/                 #   - Listing management and media enhancements
│   │   ├── marketplace/             #   - Product display templates and details client
│   │   ├── ai/                      #   - AI chatbot interfaces and voice search handlers
│   │   ├── cart/                    #   - Sidebar bag summary and context operations
│   │   └── analytics/               #   - Business forecasts and sustainability dashboards
│   │
│   ├── hooks/                       # 🪝 REUSABLE CUSTOM HOOKS (Business Logic)
│   │   ├── use-auth-form.ts         #   - Decoupled auth form state & Clerk SSO handler
│   │   ├── use-admin-dashboard.ts   #   - Moderation & application approval logic
│   │   ├── use-user-role.ts         #   - Session role resolution & cache reconciliation
│   │   └── use-products.ts          #   - Catalog loading with search & filter state
│   │
│   ├── context/                     # 📦 STATE MANAGEMENT PROVIDERS
│   │   ├── cart-context.tsx         #   - Cart operations with LocalStorage sync & memoization
│   │   ├── wishlist-context.tsx     #   - Wishlist with Supabase sync
│   │   └── language-context.tsx     #   - Multilingual internationalization dictionary
│   │
│   ├── components/                  # 🎨 MODULAR UI COMPONENTS
│   │   ├── layout/                  #   - Header, Footer, and AppShell
│   │   ├── common/                  #   - ErrorBoundary, PWA lifecycle, Online status
│   │   ├── ui/                      #   - Shadcn primitive UI design tokens
│   │   └── providers.tsx            #   - Unified AppProviders hierarchy
│   │
│   ├── types/                       # 🏷️ TYPE CONTRACTS
│   │   ├── api.ts                   #   - ApiResponse<T> & ApiErrorDetail
│   │   ├── product.ts               #   - Product models
│   │   ├── user.ts                  #   - UserProfile & UserRole models
│   │   └── index.ts                 #   - Barrel type exports
│   │
│   └── lib/                         # 🛠️ UTILITIES & HELPERS
│       ├── api-response.ts          #   - Standardized API route response constructors
│       ├── utils.ts                 #   - Tailwind merge & classnames helper
│       └── data.ts                  #   - Seed craft data
```
├── backend/                         # 🧠 PYTHON BACK-OFFICE (FastAPI & ML Services)
│   ├── app/
│   │   └── api/                     #   - FastAPI route mappings and entry gateway
│   │       └── router.py            #   - API routers definition
│   ├── ai/                          #   - Forecasting, Regression, and anomaly models
│   │   ├── pricing.py               #   - Price suggestion engine
│   │   ├── forecasting.py           #   - LSTM demand forecasting simulation
│   │   ├── graph.py                 #   - Knowledge Graph semantic resolver
│   │   ├── blockchain.py            #   - Provenance ledger simulator
│   │   └── fraud.py                 #   - Bot review anomaly detector
│   ├── data/                        #   - JSON structures (knowledge_graph.json, documents.json)
│   └── main.py                      #   - Gateway entry loader mounting app routes
```

---

## 2. Core Application Flows

### 3. Authentication Flow
```
User navigates to site
    │
    ▼
Clerk <SignInButton> / <SignUpButton> wrapper
    │
    ▼
JWT verified by ClerkProvider (src/app/layout.tsx)
    │
    ▼
Clerk User Session Object exposed to frontend context
    │
    ▼
<Show when="signed-in"> renders UserButton dashboard access
```

### 4. Product Creation Flow
```
Artisan fills product details in form (features/artisan/components/product-form.tsx)
    │
    ├── Optional: Voice Recording (voice-recorder.tsx) ──► generate-product-description flow
    ├── Optional: Image Upload ──► Vision Classifier (analyze-image flow) ──► Auto-fill tags
    │
    ▼
Artisan checks predicted pricing recommendation (backend/ai/pricing.py)
    │
    ▼
Clicks "Add Product" ──► Writes document to Cloud Firestore via services/firebase/firestore.ts
    │
    ▼
Real-time state listener updates local marketplace inventory (app/shop/page.tsx)
```

### 5. AI Assistant Flow
```
Buyer types query or uploads craft photo to assistant (features/ai/components/ai-assistant.tsx)
    │
    ▼
Triggers HeritageChatFlow (src/ai/flows/chat.ts)
    │
    ├── 1. RAG Query matches keywords inside backend/data/documents.json
    ├── 2. Prompt routes query to specialized virtual agent (Buyer/Cultural/Inventory)
    ├── 3. Calls Gemini endpoint with system instructions and product context
    │
    ▼
If DNS/API endpoint throws error ──► Catch block intercepts ──► Returns simulated multi-agent fallback
    │
    ▼
Assistant updates UI showing the responding Agent name and suggested purchase cards
```

### 6. Recommendation Flow
```
Buyer visits product details page (product/[id]/page.tsx)
    │
    ▼
Product detail controller queries Graph Database (backend/ai/graph.py)
    │
    ▼
Traverses Knowledge Graph nodes: [Product State] ──► [GI Tag Category] ──► [Artisan Community]
    │
    ▼
Returns first-degree relationships (highly relevant matching items)
    │
    ▼
Frontend displays "Artisan Provenance & Related Crafts" based on graph coordinates
```

### 7. Payment Flow
```
Buyer clicks checkout in shopping bag (features/cart/components/cart-sidebar.tsx)
    │
    ▼
Checkout router fetches server-side transaction order (backend/app/api/router.py)
    │
    ▼
FastAPI returns Razorpay Order object with transaction metadata
    │
    ▼
Frontend triggers react-razorpay payment modal ──► User authorizes payment
    │
    ▼
Success callback fires ──► Simulates blockchain ownership block mining (backend/ai/blockchain.py)
```

### 8. Firebase Data Flow
```
                     Next.js Storefront
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
services/firebase/auth.ts        services/firebase/firestore.ts
            │                                 │
   Clerk auth bridging                Real-time snapshot listener
            │                                 │
            ▼                                 ▼
   Artisan/Buyer Access            Products/Orders Collection
```

### 9. Backend API Gateway Flow
```
                  FastAPI Server Entry (backend/main.py)
                             │
                             ▼
              Gateway API Router (app/api/router.py)
                             │
      ┌──────────────┬───────┴───────┬──────────────┐
      ▼              ▼               ▼              ▼
Pricing Engine   Forecaster      Graph Search   Blockchain
 (ai/pricing)   (ai/forecast)     (ai/graph)    (ai/blockchain)
```

---

## 10. How to Add a New Feature

To add a new feature to the Viraasat ecosystem:

1. **Define Page Routing**: Create a new route folder inside `src/app/` containing a `page.tsx` file for rendering.
2. **Build Component Logic**: Implement the modular components in a new directory inside `src/features/<feature_name>/components/`.
3. **Connect Services**: Declare any external API fetch or database adapters under `src/services/` or `src/features/<feature_name>/services/`.
4. **Create AI Workflows (Optional)**: Declare server-side Genkit actions in `src/ai/flows/<workflow>.ts`.
5. **Extend Back-Office Models (Optional)**:
   * Define predictive algorithms in `backend/ai/`.
   * Add endpoints in `backend/app/api/router.py` to expose the calculations to the frontend.

---

## 11. Running the Platform Locally

Ensure both Next.js and FastAPI services are initialized simultaneously:

```bash
# Starts Python backend on port 8000 and Next.js frontend on port 9002
./run_all_viraasat.sh
```

### Frontend Environment Profile (`.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```
