# VIRAASAT Technical Architecture Guide 🏛️

This document describes the production-grade architecture of the Viraasat Platform. The project follows a **Feature-Based Modular Architecture** to ensure scalability, maintainability, and clear separation of concerns.

## 🏗️ Frontend Architecture (Next.js)

The frontend is organized by **Feature Domains** rather than file types.

### 1. Core Layer (`src/core/`)
The foundation of the application. Contains singletons and global configurations.
- `config/`: Environment variables (`env.ts`) and global constants.
- `api/`: Base API clients and response handlers.
- `utils/`: Pure utility functions (e.g., `cn` for Tailwind, image helpers).
- `hooks/`: Global hooks used across multiple features (e.g., `useToast`, `useTranslation`).
- `providers.tsx`: Global React Context providers.

### 2. Feature Layer (`src/features/`)
Each business domain is encapsulated in its own folder.
- **`auth/`**: All authentication logic, login forms, and protected route guards.
- **`marketplace/`**: Product discovery, search, and reviews.
- **`artisan/`**: The Artisan Studio, dashboard, and product management.
- **`checkout/`**: Cart logic, payment integration (Razorpay), and order processing.

**Feature Internal Structure:**
- `/components`: UI specific to this feature.
- `/hooks`: State and logic specific to this feature.
- `/services`: API calls and data transformations for this feature.
- `types.ts`: TypeScript interfaces for the domain.

### 3. UI Layer (`src/components/`)
- **`ui/`**: Atomic components (Shadcn/Radix). Zero business logic.
- **`shared/`**: Composite components used globally.
    - `/layout`: Header, Footer, AppShell.
    - `/navigation`: Navbars and menu systems.
    - `/visuals`: 3D assets and branding elements.

### 4. App Layer (`src/app/`)
Used strictly for **Routing**. Pages are lean and delegate logic to the `features` layer.

---

## ⚙️ Backend Architecture (FastAPI)

The backend follows a **Layered Service Architecture**.

### 1. API Layer (`app/api/v1/`)
Handles HTTP requests, validation (Pydantic), and response formatting.
- `router.py`: Central endpoint aggregator.
- `webhooks.py`: External signals (Clerk, Razorpay).

### 2. Service Layer (`app/services/`)
The "Brain" of the backend. Contains all business logic.
- `ai/`: ML models for forecasting, fraud detection, and knowledge graphs.
- `user_service.py`: Logic for user roles and profile management.

### 3. Core Layer (`app/core/`)
Infrastructure and security.
- `deps.py`: Dependency injection for database sessions and auth.
- `config.py`: Environment and system settings.

### 4. Data Layer (`app/db/`)
Database connections and migrations.

---

## 🔐 Authentication Flow
1. **Identity**: Managed by **Clerk**.
2. **Authorization**: Role-based access control (RBAC) stored in **Supabase**.
3. **Sync**: The system uses a "Supabase-First" approach where the `users` table in Supabase is the source of truth for roles (`artisan`, `buyer`, `admin`).

## 🚀 Scalability Guidelines
- **Adding a Feature**: Create a new folder in `src/features/` $\rightarrow$ Add routes in `src/app/` $\rightarrow$ Add services in `backend/app/services/`.
- **Updating UI**: Change the atomic component in `src/components/ui/` to reflect changes globally.
