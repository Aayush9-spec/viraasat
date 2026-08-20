# Viraasat Platform Architecture Blueprint

This document details the software architecture patterns of the **Viraasat** digital commerce platform.

---

## 🏛️ System Design Diagram

```
                 +-------------------+
                 |    Web Client     |  (Next.js Storefront)
                 +---------+---------+
                           |  HTTP / WS
                           ▼
                 +---------+---------+
                 |    API Gateway    |  (FastAPI Router)
                 +----+----+----+----+
                      |    |    |
         ┌────────────┘    |    └────────────┐
         ▼                 ▼                 ▼
+--------+--------+ +------+------+ +--------+--------+
|  Pricing Engine | | Forecast LSTM| | Knowledge Graph |
+-----------------+ +-------------+ +-----------------+
```

---

## 📂 Core Architectural Layers

1. **Routing Layer (`src/app/`)**: Next.js App Router folders holding static and dynamic route page view models.
2. **Business Feature Modules (`src/features/`)**: High cohesion subdirectories encapsulating logic for cart, shop catalogs, and seller options.
3. **Core Services Layer (`src/services/`)**: Adaptors for Firestore, Razorpay billing, and external vector queries.
4. **Python Back-Office (`backend/`)**: FastAPI gateway triggering Python ML, forecasting, and network operations.
