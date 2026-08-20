# API Endpoints Specification

This document details the REST API endpoints exposed by the Viraasat API Gateway.

---

## 🧠 Python API Gateway (`http://localhost:8000`)

### 1. Price Predictor
*   **Path**: `/api/predict-price`
*   **Method**: `POST`
*   **Payload**:
    ```json
    {
      "category": "Home Decor",
      "material": "Multani Mitti & Quartz",
      "labor_hours": 12.0,
      "size_sqft": 1.5,
      "is_organic": true
    }
    ```
*   **Response**: Suggested price ranges and sustainability premium metrics.

### 2. Demand Forecaster
*   **Path**: `/api/forecast-demand`
*   **Method**: `GET`
*   **Parameters**: `region` (e.g. Rajasthan), `category` (e.g. Textiles)
*   **Response**: 12-month demand time series index.

### 3. Knowledge Graph
*   **Path**: `/api/knowledge-graph/search`
*   **Method**: `GET`
*   **Parameters**: `query` (e.g. Mithila)
*   **Response**: Subgraph nodes and relationship edges.

### 4. Provenance Ledger
*   **Path**: `/api/blockchain/provenance/{productId}`
*   **Method**: `GET`
*   **Response**: Array of provenance transaction blocks.
