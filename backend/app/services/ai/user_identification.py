"""Promising User Identification service for Viraasat.

Provides:
  - score_user()       — evaluates a user's behavioral vector via GBT classifier + K-Means clustering
  - get_segment_overview() — returns distribution, stats, and action triggers for all user segments
"""

from __future__ import annotations

import os
import pickle
from typing import Optional

import numpy as np
from pydantic import BaseModel

# ── Model loading ─────────────────────────────────────────────────────────────

_current_dir = os.path.dirname(os.path.abspath(__file__))
_MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(_current_dir, "../../../../database/user_identification_model.pkl")),
    os.path.abspath(os.path.join(_current_dir, "../../database/user_identification_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/user_identification_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/user_identification_model.pkl")),
]
_MODEL_PATH = next((p for p in _MODEL_CANDIDATES if os.path.exists(p)), _MODEL_CANDIDATES[0])

_model: Optional[dict] = None
try:
    if os.path.exists(_MODEL_PATH):
        with open(_MODEL_PATH, "rb") as _f:
            _model = pickle.load(_f)
        print("User Identification Model loaded successfully.")
except Exception as _e:
    print(f"Warning: Failed to load User Identification Model: {_e}")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class UserBehaviorInput(BaseModel):
    user_id: str = "user-default"
    recency_days: int = 14          # Days since last purchase
    purchase_count: int = 5         # Total completed purchases
    total_spend_inr: float = 12500.0 # Lifetime spend in INR
    avg_order_inr: float = 2500.0   # Average order value
    gi_affinity_pct: float = 0.6    # Fraction of purchases that are GI-certified
    session_count: int = 15         # Sessions in last 90 days
    wishlist_count: int = 6         # Wishlisted items count
    search_count: int = 20          # Searches in last 30 days
    review_count: int = 3           # Reviews submitted
    recommendation_ctr: float = 0.45 # Recommendation click-through rate (0-1)
    return_rate: float = 0.05       # Fraction of orders returned (0-1)
    review_helpfulness: float = 3.5 # Avg helpfulness votes on reviews
    account_age_days: int = 240     # Account age in days
    is_verified: bool = True        # KYC/Email verified


# ── Fallback (no model loaded) ────────────────────────────────────────────────

def _fallback_scoring(payload: UserBehaviorInput) -> dict:
    """Heuristic scoring when the model artifact is absent."""
    score = 0.5
    if payload.total_spend_inr > 20000: score += 0.2
    if payload.return_rate < 0.08:      score += 0.15
    if payload.recency_days < 30:       score += 0.1
    if payload.is_verified:             score += 0.05

    score = min(0.99, max(0.01, score))
    is_promising = score >= 0.75

    tier = "Champion" if score >= 0.85 else ("Loyal" if score >= 0.75 else "Promising" if score >= 0.6 else "At Risk")
    return {
        "user_id":             payload.user_id,
        "promising_score":     round(score, 3),
        "is_promising":        is_promising,
        "segment_tier":        tier,
        "action_trigger":      "Rule-based fallback action assigned.",
        "model_accuracy":      None,
        "is_simulated":        True,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def score_user(payload: UserBehaviorInput) -> dict:
    """
    Score a user using the trained GBT classifier and assign a K-Means segment tier.
    """
    if _model is None:
        return _fallback_scoring(payload)

    try:
        clf        = _model["gbt_clf"]
        scaler_clf = _model["gbt_scaler"]
        km         = _model["km_model"]
        scaler_km  = _model["km_scaler"]
        labels     = _model["cluster_labels"]
        threshold  = _model["promising_threshold"]
        stats      = _model["segment_stats"]
        metrics    = _model["evaluation_metrics"]
        feature_cols = _model["feature_cols"]

        # Build feature vector matching training order
        vec = np.array([[
            payload.recency_days,
            payload.purchase_count,
            payload.total_spend_inr,
            payload.avg_order_inr,
            payload.gi_affinity_pct,
            payload.session_count,
            payload.wishlist_count,
            payload.search_count,
            payload.review_count,
            payload.recommendation_ctr,
            payload.return_rate,
            payload.review_helpfulness,
            payload.account_age_days,
            int(payload.is_verified),
        ]], dtype=np.float32)

        # 1. GBT scoring
        vec_clf = scaler_clf.transform(vec)
        prob = float(clf.predict_proba(vec_clf)[0, 1])
        is_promising = prob >= threshold

        # 2. K-Means clustering assignment
        vec_km = scaler_km.transform(vec)
        cluster_id = int(km.predict(vec_km)[0])
        tier = labels[cluster_id] if cluster_id < len(labels) else "Promising"

        tier_info = stats.get(tier, {})
        action_trigger = tier_info.get("action_trigger", "Engage with personalized offers.")

        return {
            "user_id":              payload.user_id,
            "promising_score":      round(prob, 4),
            "is_promising":         bool(is_promising),
            "promising_threshold":  threshold,
            "segment_tier":         tier,
            "action_trigger":       action_trigger,
            "model_accuracy":       metrics.get("verified_accuracy"),
            "evaluation_metrics":   metrics,
            "is_simulated":         False,
        }

    except Exception as exc:
        print(f"User scoring failed, falling back: {exc}")
        return _fallback_scoring(payload)


def get_segment_overview() -> dict:
    """Return platform-wide user segmentation overview and statistics."""
    if _model is None:
        return {"segments": {}, "model_accuracy": None, "is_simulated": True}

    metrics = _model.get("evaluation_metrics", {})
    stats   = _model.get("segment_stats", {})
    return {
        "segments":           stats,
        "model_accuracy":     metrics.get("verified_accuracy"),
        "evaluation_metrics": metrics,
        "is_simulated":       False,
    }
