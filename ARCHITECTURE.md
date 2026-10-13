# Viraasat Platform Architecture Guide

This document details the architectural principles, layers, folder organization, state management, error handling protocols, and API design conventions implemented across the Viraasat ecosystem.

---

## 1. System Overview & Architectural Layers

The Viraasat platform follows a **Clean Feature-Driven Architecture** separated into distinct layers:

```
┌───────────────────────────────────────────────────────────┐
│               1. Presentation Layer (UI)                  │
│   Next.js App Router Pages, Modular Components, Layouts   │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│             2. Domain & Feature Logic Layer               │
│     Custom Feature Hooks, Domain Models, Validators       │
│  (e.g., useAuthForm, useAdminDashboard, useCart, etc.)    │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                 3. Application State Layer                │
│    AppProviders, CartContext, WishlistContext, Language   │
│         Persistent LocalStorage & Supabase Realtime       │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│               4. Service & API Gateway Layer              │
│       Resilient ApiClient, Service Adapters, Firebase     │
│          Supabase Client, Python FastAPI Backend          │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│             5. Config & Infrastructure Layer              │
│    Type-safe env.ts, site.ts, constants.ts, Next Config   │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
frontend/src/
├── app/                      # Next.js App Router (pages and API routes)
│   ├── (auth)/               # Login / Signup route wrappers
│   ├── admin/                # Admin verification and moderation dashboard
│   ├── api/                  # Serverless route handlers (create-order, products, etc.)
│   ├── artisan/              # Artisan dashboard, product management, provenance
│   ├── shop/                 # Marketplace listing & catalog
│   ├── layout.tsx            # Root layout with AppProviders and AppShell
│   └── globals.css           # Global CSS variables and tailwind layers
│
├── config/                   # Centralized Type-Safe Configuration
│   ├── env.ts                # Validated environment variables with fallback defaults
│   ├── site.ts               # Site metadata, navigation items, social links
│   ├── constants.ts          # Storage keys, user roles, order statuses, pagination
│   └── index.ts              # Barrel export
│
├── services/                 # API & External Integration Layer
│   ├── api/                  # Scalable API Client and Domain Endpoints
│   │   ├── client.ts         # ApiClient with timeout, headers, & error handling
│   │   ├── products.ts       # Product endpoints
│   │   ├── orders.ts         # Payment & order creation endpoints
│   │   ├── ai.ts             # Chat and AI flow endpoints
│   │   ├── users.ts          # User profile and role sync endpoints
│   │   └── index.ts          # Barrel export
│   ├── backend/              # Python FastAPI backend clients
│   ├── firebase/             # Client-side Firebase Firestore/Auth drivers
│   └── supabase.ts           # Supabase client singleton
│
├── features/                 # Modular Domain Features
│   ├── marketplace/          # Catalog, filters, product cards, product services
│   ├── artisan/              # Onboarding, listing editor, inventory service
│   ├── cart/                 # Cart sidebar drawer, summary cards
│   ├── orders/               # Order status tracking, order receipt components
│   ├── ai/                   # Virtual heritage assistant, voice search
│   └── analytics/            # Artisan metrics & demand forecasting
│
├── components/               # UI Component Hierarchy
│   ├── layout/               # Shell, Header, and Footer
│   │   ├── app-shell.tsx     # App layout container
│   │   ├── header.tsx        # Responsive sticky navbar
│   │   ├── footer.tsx        # Site footer & newsletter
│   │   └── index.ts          # Barrel export
│   ├── common/               # Shared cross-cutting components
│   │   ├── error-boundary.tsx# React ErrorBoundary with reset & logging
│   │   ├── pwa-lifecycle.tsx # Service Worker and offline state
│   │   └── online-status.tsx # Network connectivity banner
│   ├── ui/                   # Primitive design tokens (Buttons, Dialogs, Cards)
│   └── providers.tsx         # Unified AppProviders composition tree
│
├── hooks/                    # Reusable React Hooks (Business Logic)
│   ├── use-auth-form.ts      # Authentication logic, Clerk SSO, error handling
│   ├── use-admin-dashboard.ts# Moderation, application review, realtime updates
│   ├── use-user-role.ts      # Session role resolution & cache reconciliation
│   ├── use-product-reviews.ts# Reviews query and submission
│   └── use-toast.ts          # Notification toast dispatcher
│
├── context/                  # Global State Contexts
│   ├── cart-context.tsx      # Cart state with LocalStorage persistence & memoization
│   ├── wishlist-context.tsx  # Wishlist state with Supabase sync
│   └── language-context.tsx  # Multilingual i18n dictionary state
│
├── types/                    # Core TypeScript Data Contracts
│   ├── api.ts                # Standard ApiResponse<T> & ApiErrorDetail
│   ├── product.ts            # Product & Review models
│   ├── user.ts               # UserProfile & UserRole types
│   ├── order.ts              # Order & LineItem interfaces
│   └── index.ts              # Unified type exports
│
└── lib/                      # Pure Utilities & Formatters
    ├── api-response.ts       # apiSuccess and apiError Route Handler constructors
    ├── utils.ts              # ClassName merge (clsx + tailwind-merge)
    └── data.ts               # Seed catalog and artisan datasets
```

---

## 3. Separation of Concerns & Business Logic

UI components (`src/components/`) must focus strictly on **rendering declarative markup, styling, and accessible interactions**. Complex side-effects, API calls, and validation rules are abstracted into dedicated hooks and services:

1. **Authentication Flow (`useAuthForm`)**:
   - `LoginForm` delegates state, Clerk credential validation, SSO redirects, and toast alerts to `useAuthForm`.
   - Enables independent unit testing of authentication logic without mocking DOM nodes.

2. **Admin Operations (`useAdminDashboard`)**:
   - Moderation verdicts, applicant status transitions, realtime PostgreSQL change subscriptions, and aggregate metrics live inside `useAdminDashboard`.
   - `AdminDashboardPage` remains a clean visual interface with tabs and data tables.

3. **Data Access Layer (`services/api/`)**:
   - Components and routes consume typed API functions (`productsApi.getAll()`, `ordersApi.createRazorpayOrder()`) rather than writing manual `fetch` calls.

---

## 4. State Management Architecture

Viraasat uses a multi-tier state architecture:

| State Scope | Solution | Persistence | Re-render Optimization |
| :--- | :--- | :--- | :--- |
| **Global Theme & Language** | `ThemeContext`, `LanguageContext` | `localStorage` | Fast CSS attribute & dictionary memoization |
| **Cart & Bag** | `CartContext` | `localStorage` (`viraasat-cart`) | `useCallback` & `useMemo` dispatchers |
| **Wishlist** | `WishlistContext` | `localStorage` + Supabase RLS | Optimistic updates + Realtime channels |
| **Authentication & Role** | Clerk JWT + `useUserRole` | `localStorage` (`viraasat_session_role`) | Role caching with asynchronous reconciliation |
| **Server State & Catalog** | `ProductService` & Next.js cache | Static SSG + ISR revalidation | Dynamic routing with edge caching |

All global context providers are composed hierarchically inside `src/components/providers.tsx`:
`ErrorBoundary` → `ClerkProvider` → `LanguageProvider` → `ThemeProvider` → `CartProvider` → `WishlistProvider`.

---

## 5. Standardized Error Handling

### 5.1 Client-Side Runtime Protection
All React component trees are wrapped by `src/components/common/error-boundary.tsx`. In the event of an unhandled runtime error (e.g., WebGL crashes in 3D canvas, broken media links, or third-party script failures), the boundary:
- Traps the error safely without unmounting the whole viewport.
- Logs structured debug info.
- Displays an intuitive fallback UI with a **"Try again"** recovery action.

### 5.2 Next.js Route Handlers (`src/lib/api-response.ts`)
All serverless API routes return a unified JSON payload:

```ts
// Success:
{
  "success": true,
  "data": { ... },
  "message": "Optional feedback"
}

// Failure:
{
  "success": false,
  "error": {
    "message": "Human readable explanation",
    "code": "ERROR_CODE",
    "status": 400,
    "details": { ... }
  }
}
```

---

## 6. Type-Safe Environment Configuration (`src/config/env.ts`)

Direct, scattered references to `process.env` are eliminated. Applications read settings from `env`:

```ts
import { env } from '@/config/env';

// Type-safe, validated with defaults:
const apiUrl = env.app.url;
const isSupabaseReady = env.supabase.isConfigured;
const razorpayKey = env.razorpay.keyId;
```

---

## 7. Naming Conventions

- **Files & Folders**: Strict `kebab-case` (e.g., `lazy-carousel.tsx`, `use-auth-form.ts`, `api-client.ts`).
- **Components**: `PascalCase` (e.g., `AppShell`, `ProductCard`, `LoginForm`).
- **Hooks**: `camelCase` prefixed with `use` (e.g., `useCart`, `useAdminDashboard`).
- **Types & Interfaces**: `PascalCase` (e.g., `ApiResponse<T>`, `Product`, `Order`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `STORAGE_KEYS`, `DEFAULT_CURRENCY`).
