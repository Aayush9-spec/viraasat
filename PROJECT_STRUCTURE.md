# Viraasat Platform – Codebase Map for Everyone

Welcome to the **Viraasat** digital commerce ecosystem! This guide is written in plain language for artisans, business owners, and non-technical stakeholders to help you understand how the different files in this folder build our intelligent handicraft platform.

---

## 🏛️ The Marketplace Analogy

Think of Viraasat as a high-end physical handicraft store in a heritage palace:

1. **The Storefront (Next.js Pages)**: What buyers see when they walk in. The main entry door, the product display shelves, and the checkout counter.
2. **The Smart Assistant (Multi-Agent Chatbot)**: A personal guide standing inside the store who answers questions about where crafts come from, checks stock, and recommends items.
3. **The Back-Office (FastAPI API)**: The accountant, inventory manager, and regional historian working behind closed doors to calculate fair prices and forecast seasonal sales.

---

## 📂 Folder Breakdown

Here is a map of the folders in this repository and what they do:

```
viraasat/
├── backend/                  # 🧠 THE BRAIN (Python)
│   ├── data/                 #   - Libraries containing GI heritage registry and connections
│   └── main.py               #   - The main calculations manager (pricing, forecasts, metrics)
│
├── src/                      # 🎨 THE STOREFRONT (React / TypeScript)
│   ├── app/                  #   - The individual rooms/pages of our website (Shop, Dashboard)
│   ├── components/           #   - The building blocks (individual buttons, cards, forms, menus)
│   ├── ai/                   #   - The connection channels linking the storefront to Gemini AI
│   └── context/              #   - Memory cells storing active cart items and language preferences
│
└── public/                   # 🖼️ THE DISPLAY WINDOW (Images, Logos, Icons)
```

---

## 🔧 Component Guide: How it works in simple terms

### 1. The Listing Form (`src/components/product-form.tsx`)
*   **What it does**: The digital paperwork an artisan fills out to add a product to the shop.
*   **Intelligent Features**:
    *   **Computer Vision Scan**: When you add an image of a vase, it scans the image and automatically fills in the category, style tags, and region so the artisan doesn't have to type it.
    *   **Price Predictor**: Takes the labor hours and materials used and suggests a fair price range based on current market dynamics.

### 2. The Shopping Assistant (`src/components/ai-assistant.tsx`)
*   **What it does**: The floating chat bubble on the bottom right.
*   **Intelligent Features**:
    *   **Multi-Agent Coordination**: Routes customer questions to specialized virtual assistants (e.g. *Buyer Agent* for product recommendations or *Cultural Research Agent* for origin stories).
    *   **Visual Search**: Customers can upload a photo of a craft to ask questions about it or find matching items.

### 3. The Digital Product Passport (`src/components/product-detail-page.tsx`)
*   **What it does**: The certificate of authenticity attached to each item.
*   **Features**:
    *   Shows the provenance (history of ownership) verified by simulated blockchain.
    *   Displays the ecological footprint (carbon scores and local sourcing percentage).

### 4. The Business Dashboards (`src/app/dashboard/`)
*   **What it does**: Behind-the-scenes insights page for artisans.
*   **Features**:
    *   **Sustainability**: Visual charts showing carbon targets and eco-compliance.
    *   **Business Advisor**: Generates predicted demand curves for the next 12 months based on tourism seasons.
    *   **Telemetry Metrics**: A technical control panel showing how fast the AI search is working.

---

## 🚀 How to Run the Platform
To start both the Back-Office and Storefront services simultaneously, double-click or run:
```bash
./run_all_viraasat.sh
```
- **Storefront link**: `http://localhost:9002`
- **Back-Office link**: `http://localhost:8000`
