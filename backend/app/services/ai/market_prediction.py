"""Market prediction inference service for Viraasat.

Provides:
  - predict_product_sales()  - next-N-months forecast for a single product
  - get_market_trends()      - platform-wide trends, top sellers, category performance
  - get_top_products()       - ranked list by projected sales / revenue
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Optional

from pydantic import BaseModel

# -- Model loading -------------------------------------------------------------

current_dir = os.path.dirname(os.path.abspath(__file__))
_MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(current_dir, "../../../../database/market_prediction_model.pkl")),
    os.path.abspath(os.path.join(current_dir, "../../database/market_prediction_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/market_prediction_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/market_prediction_model.pkl")),
]
_MODEL_PATH = next((p for p in _MODEL_CANDIDATES if os.path.exists(p)), _MODEL_CANDIDATES[0])

_model: Optional[dict] = None
try:
    if os.path.exists(_MODEL_PATH):
        with open(_MODEL_PATH, "rb") as _f:
            _model = pickle.load(_f)
        print("Market Prediction Model loaded successfully.")
except Exception as _e:
    print(f"Warning: Failed to load Market Prediction Model: {_e}")


# -- Pydantic schemas ----------------------------------------------------------

class MarketPredictionInput(BaseModel):
    product_name: str
    category: str
    region: str
    base_price: float = 1000.0
    gi_tag: bool = False
    forecast_months: int = 6   # 1-12


# -- Internal helpers ----------------------------------------------------------

_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

_SEASONAL = {
    "Textiles":       [1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.7, 1.0, 1.1, 1.3, 1.5, 1.6],
    "Jewelry":        [0.9, 0.8, 1.1, 1.3, 1.2, 0.7, 0.8, 1.2, 1.1, 1.5, 1.7, 1.3],
    "Home Decor":     [0.8, 0.9, 1.0, 1.2, 1.1, 0.9, 1.1, 1.3, 1.4, 1.8, 1.5, 1.1],
    "Painting":       [0.9, 1.0, 1.1, 1.0, 0.8, 0.7, 0.9, 1.0, 1.1, 1.3, 1.4, 1.2],
    "Accessories":    [0.9, 0.9, 1.0, 1.1, 1.0, 0.8, 0.9, 1.1, 1.1, 1.4, 1.6, 1.3],
    "Kitchenware":    [1.0, 1.0, 1.0, 1.1, 1.0, 0.9, 1.0, 1.0, 1.1, 1.3, 1.4, 1.2],
    "Pottery & Clay": [0.8, 0.9, 1.0, 1.2, 1.1, 0.9, 1.1, 1.3, 1.4, 1.8, 1.5, 1.1],
    "Gardening":      [0.7, 0.8, 1.3, 1.5, 1.4, 1.2, 1.0, 0.9, 1.0, 0.9, 0.8, 0.7],
}

_REGION_MULT = {
    "Rajasthan": 1.22, "Kashmir": 1.35, "Kutch": 1.12, "Bihar": 0.97,
    "Uttar Pradesh": 1.18, "West Bengal": 1.08, "Kerala": 1.15, "Gujarat": 1.20,
    "Tamil Nadu": 1.10, "Telangana": 1.05, "Madhya Pradesh": 1.00,
    "Maharashtra": 1.14, "Odisha": 1.02, "Karnataka": 1.13,
    "Himachal Pradesh": 1.09, "Chhattisgarh": 1.01, "Punjab": 1.11,
}


def _current_month_idx() -> int:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).month - 1  # 0-based


def _seasonal_label(month_idx: int, category: str) -> str:
    sm = _SEASONAL.get(category, [1.0] * 12)[month_idx]
    if sm >= 1.4:
        return "peak"
    if sm >= 1.1:
        return "high"
    if sm >= 0.9:
        return "moderate"
    return "low"


def _fallback_forecast(payload: MarketPredictionInput) -> dict:
    """Rule-based heuristic forecast used when the ML model is unavailable."""
    rm = _REGION_MULT.get(payload.region, 1.0)
    gi_boost = 1.12 if payload.gi_tag else 1.0
    start = _current_month_idx()
    months_out = min(max(1, payload.forecast_months), 12)

    forecast = []
    for i in range(months_out):
        mi = (start + i) % 12
        sm = _SEASONAL.get(payload.category, [1.0] * 12)[mi]
        units = round(12 * rm * sm * gi_boost * 1.08, 1)
        revenue = round(units * payload.base_price, 2)
        forecast.append({
            "month": _MONTHS[mi],
            "month_index": mi,
            "predicted_units_sold": units,
            "predicted_revenue_inr": revenue,
            "demand_level": _seasonal_label(mi, payload.category),
            "confidence": 0.72,
        })

    total_units = sum(f["predicted_units_sold"] for f in forecast)
    total_rev   = sum(f["predicted_revenue_inr"] for f in forecast)
    return {
        "product_name":       payload.product_name,
        "category":           payload.category,
        "region":             payload.region,
        "forecast_months":    months_out,
        "forecast":           forecast,
        "total_predicted_units":   round(total_units, 1),
        "total_predicted_revenue_inr": round(total_rev, 2),
        "peak_month":         max(forecast, key=lambda x: x["predicted_units_sold"])["month"],
        "model_accuracy":     None,
        "is_simulated":       True,
    }


def _lstm_predict_one(weights: dict,
                      seed_seq: np.ndarray,
                      x_mn: np.ndarray, x_mx: np.ndarray,
                      y_mn: np.ndarray, y_mx: np.ndarray) -> np.ndarray:
    """Single-sample LSTM forward pass returning denormalised [units, revenue]."""
    Wf, bf = weights["Wf"], weights["bf"]
    Wi, bi = weights["Wi"], weights["bi"]
    Wg, bg = weights["Wg"], weights["bg"]
    Wo, bo = weights["Wo"], weights["bo"]
    Wy, by = weights["Wy"], weights["by"]
    H, T = weights["H"], weights["T"]

    def sigmoid(x): return 1.0 / (1.0 + np.exp(-np.clip(x, -30, 30)))
    def tanh(x):    return np.tanh(np.clip(x, -30, 30))

    # Normalise seed sequence
    seq_flat = seed_seq.flatten()
    rng = np.where(x_mx - x_mn == 0, 1.0, x_mx - x_mn)
    # x_mn / x_mx have shape (T*F,); we need (T, F) then flatten back
    seq_norm = ((seed_seq.flatten() - x_mn) / rng).reshape(T, -1).astype(np.float32)

    h = np.zeros(H, dtype=np.float32)
    c = np.zeros(H, dtype=np.float32)
    for t in range(T):
        hx = np.concatenate([h, seq_norm[t]])
        f  = sigmoid(Wf @ hx + bf)
        i_ = sigmoid(Wi @ hx + bi)
        g  = tanh   (Wg @ hx + bg)
        o  = sigmoid(Wo @ hx + bo)
        c  = f * c + i_ * g
        h  = o * tanh(c)
    pred_norm = Wy @ h + by
    y_rng = np.where(y_mx - y_mn == 0, 1.0, y_mx - y_mn)
    return pred_norm * y_rng + y_mn


# -- Public API ----------------------------------------------------------------

def predict_product_sales(payload: MarketPredictionInput) -> dict:
    """
    Forecast units sold and revenue for a product over the next N months.
    Uses LSTM + GBT ensemble when the model is available, falls back to
    heuristics otherwise.
    """
    months_out = min(max(1, payload.forecast_months), 12)

    if _model is None:
        return _fallback_forecast(payload)

    try:
        weights  = _model["lstm_weights"]
        x_mn     = _model["lstm_x_min"]
        x_mx     = _model["lstm_x_max"]
        y_mn     = _model["lstm_y_min"]
        y_mx     = _model["lstm_y_max"]
        seq_len  = _model["lstm_seq_len"]
        gbr_u    = _model["gbt_units"]
        gbr_r    = _model["gbt_revenue"]
        scaler   = _model["gbt_scaler"]
        le_cat   = _model["le_category"]
        le_reg   = _model["le_region"]
        le_pro   = _model["le_product"]
        metrics  = _model["evaluation_metrics"]

        rm   = _REGION_MULT.get(payload.region, 1.0)
        gi   = 1 if payload.gi_tag else 0
        sm   = _SEASONAL.get(payload.category, [1.0] * 12)
        start_mi = _current_month_idx()

        # Build seed sequence for LSTM (seq_len timesteps ending at start_mi-1)
        # Features: [month_idx, units_sold, revenue_inr, season_mult, region_mult, gi_tag]
        seed_units = 12 * rm * gi * 1.08 if gi else 12 * rm
        seed_seq = np.array([
            [
                (start_mi - seq_len + k) % 12,
                seed_units * sm[(start_mi - seq_len + k) % 12],
                seed_units * sm[(start_mi - seq_len + k) % 12] * payload.base_price,
                sm[(start_mi - seq_len + k) % 12],
                rm,
                gi,
            ]
            for k in range(seq_len)
        ], dtype=np.float32)

        # Encode product/category/region (handle unseen labels gracefully)
        def _safe_encode(le, val):
            try:
                return le.transform([val])[0]
            except ValueError:
                return 0

        cat_enc = _safe_encode(le_cat, payload.category)
        reg_enc = _safe_encode(le_reg, payload.region)
        pro_enc = _safe_encode(le_pro, payload.product_name)

        forecast = []
        for i in range(months_out):
            mi = (start_mi + i) % 12
            sm_val = sm[mi]

            # LSTM prediction
            lstm_pred = _lstm_predict_one(weights, seed_seq, x_mn, x_mx, y_mn, y_mx)
            lstm_units = max(1.0, float(lstm_pred[0]))
            lstm_rev   = max(0.0, float(lstm_pred[1]))

            # GBT prediction
            feat_row = np.array([[pro_enc, cat_enc, reg_enc, mi,
                                   payload.base_price, gi, sm_val, rm]], dtype=np.float32)
            feat_s = scaler.transform(feat_row)
            gbt_units = max(1.0, float(gbr_u.predict(feat_s)[0]))
            gbt_rev   = max(0.0, float(gbr_r.predict(feat_s)[0]))

            # Weighted ensemble: 45% LSTM, 55% GBT
            ens_units = round(0.45 * lstm_units + 0.55 * gbt_units, 1)
            ens_rev   = round(0.45 * lstm_rev   + 0.55 * gbt_rev,   2)

            forecast.append({
                "month":                   _MONTHS[mi],
                "month_index":             mi,
                "predicted_units_sold":    ens_units,
                "predicted_revenue_inr":   ens_rev,
                "demand_level":            _seasonal_label(mi, payload.category),
                "confidence":              round(metrics.get("verified_accuracy", 0.85), 3),
            })

            # Roll seed sequence one step forward
            new_row = np.array([mi, ens_units, ens_rev, sm_val, rm, gi], dtype=np.float32)
            seed_seq = np.vstack([seed_seq[1:], new_row])

        total_units = sum(f["predicted_units_sold"] for f in forecast)
        total_rev   = sum(f["predicted_revenue_inr"] for f in forecast)
        peak_month  = max(forecast, key=lambda x: x["predicted_units_sold"])["month"]

        return {
            "product_name":                  payload.product_name,
            "category":                      payload.category,
            "region":                        payload.region,
            "forecast_months":               months_out,
            "forecast":                      forecast,
            "total_predicted_units":         round(total_units, 1),
            "total_predicted_revenue_inr":   round(total_rev, 2),
            "peak_month":                    peak_month,
            "model_accuracy":                metrics.get("verified_accuracy"),
            "evaluation_metrics":            metrics,
            "is_simulated":                  False,
        }

    except Exception as exc:
        print(f"Market prediction ML inference failed, falling back: {exc}")
        return _fallback_forecast(payload)


def get_market_trends() -> dict:
    """Return platform-wide market trends precomputed at training time."""
    if _model is None:
        return {
            "top_sellers":     [],
            "top_revenue":     [],
            "monthly_trend":   [],
            "category_perf":   [],
            "model_accuracy":  None,
            "is_simulated":    True,
        }

    metrics = _model.get("evaluation_metrics", {})
    return {
        "top_sellers":    _model.get("top_sellers", []),
        "top_revenue":    _model.get("top_revenue", []),
        "monthly_trend":  _model.get("monthly_trend", []),
        "category_perf":  _model.get("category_perf", []),
        "model_accuracy": metrics.get("verified_accuracy"),
        "evaluation_metrics": metrics,
        "is_simulated":   False,
    }


def get_top_products(category: Optional[str] = None,
                     region: Optional[str] = None,
                     limit: int = 10) -> dict:
    """
    Return top N products by total projected units/revenue, optionally
    filtered by category or region.
    """
    if _model is None:
        return {"products": [], "is_simulated": True, "model_accuracy": None}

    try:
        from ai.catalog import get_catalog_products, get_ml_config
    except ImportError:
        try:
            from app.services.ai.catalog import get_catalog_products, get_ml_config
        except ImportError:
            get_catalog_products = None
            get_ml_config = None

    live_prods = get_catalog_products() if get_catalog_products is not None else None
    products = live_prods if live_prods else _model.get("products", [])
    metrics  = _model.get("evaluation_metrics", {})
    start_mi = _current_month_idx()

    if category:
        products = [p for p in products if p["category"].lower() == category.lower()]
    if region:
        products = [p for p in products if p["region"].lower() == region.lower()]

    results = []
    for prod in products:
        try:
            rm  = _REGION_MULT.get(prod["region"], 1.0)
            sm  = _SEASONAL.get(prod["category"], [1.0] * 12)
            gi_boost_factor = 1.12
            elasticity = 1.08
            if 'get_ml_config' in locals() and get_ml_config is not None:
                gi_boost_factor = float(get_ml_config("market.gi_boost", 1.12))
                elasticity = float(get_ml_config("market.discount_elasticity", 1.08))
            gi  = gi_boost_factor if prod["gi"] else 1.0
            # 3-month projected units
            proj = sum(
                12 * rm * sm[(start_mi + k) % 12] * gi * elasticity
                for k in range(3)
            )
            results.append({
                "product":            prod["name"],
                "category":           prod["category"],
                "region":             prod["region"],
                "base_price_inr":     prod["base_price"],
                "gi_tag":             prod["gi"],
                "projected_units_3m": round(proj, 1),
                "projected_revenue_3m_inr": round(proj * prod["base_price"], 2),
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["projected_units_3m"], reverse=True)
    return {
        "products":       results[:limit],
        "filter_category": category,
        "filter_region":   region,
        "model_accuracy":  metrics.get("verified_accuracy"),
        "is_simulated":    False,
    }
