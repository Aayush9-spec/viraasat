# Viraasat 2.0 — Architecture Specification

This document details the target architecture for Viraasat 2.0, transitioning the project from a prototype to a full production-ready, measurable, and academically robust software engineering project.

## 1. System Topology

The system maintains a decoupled, API-driven architecture split between a frontend application and a specialized AI backend.

### Frontend Application (Next.js)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: React Context, Zod (Validation)
- **Authentication**: Clerk (JWT-based)
- **Primary Database**: Firebase Firestore (NoSQL for user data, products, orders)
- **Storage**: Firebase Storage (Image assets, digital documents)
- **Responsibilities**: User authentication, rendering the marketplace, cart/checkout flows, artisan dashboard, and serving as the primary client interface for the Genkit AI flows.

### Backend Intelligence Layer (FastAPI)
- **Framework**: FastAPI (Python)
- **Machine Learning**: Scikit-Learn, TensorFlow/PyTorch (Replacing current simulated logic)
- **Graph Database**: Neo4j or managed Graph DB (Replacing `knowledge_graph.json`)
- **Responsibilities**: Exposing endpoints for demand forecasting, dynamic pricing, fraud detection, and complex data processing that are too computationally heavy for the frontend.

---

## 2. Component Migration Plan (From Simulated to Real)

To meet the strict requirements of Viraasat 2.0, the following components must be migrated from their current simulated state to real implementations:

### A. Dynamic Pricing Engine
- **Current State**: Hardcoded rules and static base rates.
- **Target Architecture**: Train a regression model (e.g., Random Forest Regressor) using historical e-commerce pricing datasets (like Kaggle artisan/handicraft datasets). Features will include material cost, labor hours, region, and organic certification status.
- **Deployment**: Pickle/joblib the model and load it on startup in FastAPI.

### B. Demand Forecasting
- **Current State**: Random deviations applied to a hardcoded seasonal array.
- **Target Architecture**: Implement a Time-Series forecasting model (ARIMA or Facebook Prophet) trained on seasonal consumer demand data for handicrafts/textiles.

### C. Fraud & Anomaly Detection
- **Current State**: Simple string length and keyword matching.
- **Target Architecture**: Use an actual Isolation Forest or One-Class SVM trained on text embeddings (TF-IDF or Word2Vec) of review datasets to detect anomalous review behaviors (review bombing, bot padding).

### D. Provenance & Blockchain
- **Current State**: Mimics block mining using `os.urandom()`.
- **Target Architecture**: Deploy a lightweight smart contract on a testnet (e.g., Polygon Mumbai or Ethereum Sepolia) to mint a unique NFT or digital passport for high-value artisan items, establishing undeniable on-chain provenance. 

### E. Graph Search (Recommendations)
- **Current State**: JSON file traversal.
- **Target Architecture**: Migrate the relationships (Product -> Artisan -> Region -> GI Tag) into a Neo4j instance to run actual graph traversal queries (Cypher) for "related items" and cultural context.

---

## 3. Data Flow Improvements

1. **Firestore Syncing**: The `src/app/shop/page.tsx` must be rebuilt to fetch live products from Firestore instead of relying on `src/lib/data.ts`.
2. **Checkout Routing**: Replace the hardcoded `localhost:8000` call in checkout with the native Next.js API route to ensure self-contained transaction handling.
3. **Auth Binding**: Clerk's `userId` must be used as the document ID or a reference field in Firestore to map Artisans to their products securely.

---

## 4. Evaluation Metrics

Every AI feature must have a measurable metric in Viraasat 2.0:
- **Forecasting**: MAPE (Mean Absolute Percentage Error).
- **Pricing**: R² (R-squared) score against true market value datasets.
- **Fraud Detection**: Precision, Recall, and F1-Score.
- **Genkit RAG**: Response latency, context retrieval accuracy, and user feedback score (Thump Up/Down).
