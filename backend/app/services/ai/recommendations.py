"""Multi-stage recommendation inference service for Viraasat.

Stage 1  - Two-Tower retrieval  : user embedding x item embedding -> top-100 candidates
Stage 2  - GBT ranker           : feature-based click-prob -> sorted top-K
Extra    - Co-purchase ("also bought") : pre-computed item-item similarity matrix
"""

from __future__ import annotations

import os
import pickle
from typing import Optional

import numpy as np
from pydantic import BaseModel

# -- Model loading -------------------------------------------------------------

_current_dir = os.path.dirname(os.path.abspath(__file__))
_MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(_current_dir, "../../../../database/recommendation_model.pkl")),
    os.path.abspath(os.path.join(_current_dir, "../../database/recommendation_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/recommendation_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/recommendation_model.pkl")),
]
_MODEL_PATH = next((p for p in _MODEL_CANDIDATES if os.path.exists(p)), _MODEL_CANDIDATES[0])

_model: Optional[dict] = None
try:
    if os.path.exists(_MODEL_PATH):
        with open(_MODEL_PATH, "rb") as _f:
            _model = pickle.load(_f)
        print("Recommendation Model loaded successfully.")
except Exception as _e:
    print(f"Warning: Failed to load Recommendation Model: {_e}")


# -- Pydantic schemas ----------------------------------------------------------

class RecommendationInput(BaseModel):
    user_region: str = "Rajasthan"
    preferred_category: str = "Home Decor"
    price_tier: str = "mid"          # budget | mid | premium | luxury
    gi_preference: bool = True
    top_k: int = 10                  # 1-20


# -- Internal helpers ----------------------------------------------------------

_CATEGORIES  = ["Home Decor", "Jewelry", "Textiles", "Kitchenware",
                "Accessories", "Gardening", "Painting", "Pottery & Clay"]
_REGIONS     = ["Rajasthan", "Kashmir", "Gujarat", "Bihar", "Uttar Pradesh",
                "West Bengal", "Kerala", "Tamil Nadu", "Karnataka", "Odisha",
                "Maharashtra", "Chhattisgarh", "Punjab", "Himachal Pradesh",
                "Telangana", "Madhya Pradesh"]
_PRICE_TIERS = ["budget", "mid", "premium", "luxury"]
_MATERIALS   = ["Ceramic", "Cotton", "Terracotta", "Modal Silk", "Cashmere",
                "Wood", "Bell Metal", "Zinc Alloy", "Handmade Paper", "Walnut Wood",
                "Palm Leaf", "Canvas", "Castor Oil Paint", "Marble", "Wool", "Silk"]


def _price_tier(price: float) -> str:
    if price < 500:   return "budget"
    if price < 2000:  return "mid"
    if price < 8000:  return "premium"
    return "luxury"


def _one_hot(val: str, vocab: list) -> np.ndarray:
    vec = np.zeros(len(vocab), dtype=np.float32)
    if val in vocab:
        vec[vocab.index(val)] = 1.0
    return vec


def _user_vec(region: str, fav_cat: str, price_tier: str, gi_pref: bool) -> np.ndarray:
    return np.concatenate([
        _one_hot(region,     _REGIONS),
        _one_hot(fav_cat,    _CATEGORIES),
        _one_hot(price_tier, _PRICE_TIERS),
        [float(gi_pref)],
    ]).astype(np.float32)


def _relu(x):    return np.maximum(0, x)
def _sigmoid(x): return 1.0 / (1.0 + np.exp(-np.clip(x, -30, 30)))


def _user_embed(w: dict, u_vec: np.ndarray) -> np.ndarray:
    h = _relu(w["Wu1"] @ u_vec + w["bu1"])
    return w["Wu2"] @ h + w["bu2"]


def _ranking_features(prod: dict, region: str, fav_cat: str,
                      price_tier: str, gi_pref: bool) -> np.ndarray:
    same_cat    = int(fav_cat == prod["category"])
    same_region = int(region  == prod["region"])
    tier_match  = int(price_tier == _price_tier(prod["price"]))
    gi_match    = int(gi_pref    == prod["gi"])
    cat_idx     = (_CATEGORIES.index(prod["category"])
                   if prod["category"] in _CATEGORIES else 0)
    reg_idx     = (_REGIONS.index(prod["region"])
                   if prod["region"] in _REGIONS else 0)
    tier_idx    = _PRICE_TIERS.index(_price_tier(prod["price"]))
    return np.array([
        same_cat, same_region, tier_match, gi_match,
        np.log1p(prod["price"]) / 12.0,
        int(prod["gi"]),
        cat_idx  / len(_CATEGORIES),
        reg_idx  / len(_REGIONS),
        tier_idx / len(_PRICE_TIERS),
    ], dtype=np.float32)


# -- Fallback (no model loaded) ------------------------------------------------

def _fallback_recommendations(payload: RecommendationInput) -> dict:
    """Rule-based fallback when the trained model is unavailable."""
    from train_recommendations import PRODUCTS  # reuse product list

    scored = []
    for prod in PRODUCTS:
        score = 0.0
        if prod["category"] == payload.preferred_category: score += 3.0
        if prod["region"]   == payload.user_region:        score += 2.0
        if prod["gi"] == payload.gi_preference:            score += 1.0
        if _price_tier(prod["price"]) == payload.price_tier: score += 1.5
        scored.append({**prod, "score": round(score, 3),
                       "match_reason": "rule-based fallback"})

    scored.sort(key=lambda x: x["score"], reverse=True)
    top_k = min(max(1, payload.top_k), 20)
    return {
        "recommendations": scored[:top_k],
        "also_bought":     [],
        "model_accuracy":  None,
        "is_simulated":    True,
    }


# -- Public API ----------------------------------------------------------------

def get_recommendations(payload: RecommendationInput) -> dict:
    """
    Two-stage recommendation:
      1. Two-Tower cosine ANN -> retrieve top-100 candidates
      2. GBT ranker -> re-sort to top-K

    Falls back to rule-based scoring when the model artifact is absent.
    """
    top_k = min(max(1, payload.top_k), 20)

    if _model is None:
        return _fallback_recommendations(payload)

    try:
        weights          = _model["two_tower"]
        item_embeddings  = _model["item_embeddings"]
        ranker           = _model["ranker"]
        products         = _model["products"]
        metrics          = _model["evaluation_metrics"]
        prod_map         = {p["id"]: p for p in products}

        # -- Stage 1: Two-Tower retrieval -------------------------------------
        u_vec = _user_vec(payload.user_region, payload.preferred_category,
                          payload.price_tier, payload.gi_preference)
        eu    = _user_embed(weights, u_vec)
        eu_norm = eu / (np.linalg.norm(eu) + 1e-9)

        retrieval_scores = {}
        for pid, emb in item_embeddings.items():
            emb_norm = emb / (np.linalg.norm(emb) + 1e-9)
            retrieval_scores[pid] = float(np.dot(eu_norm, emb_norm))

        # Keep top-100 candidates (or all if fewer products)
        candidates = sorted(retrieval_scores, key=retrieval_scores.get, reverse=True)[:100]

        # -- Stage 2: GBT re-ranking -------------------------------------------
        feat_rows = np.array([
            _ranking_features(prod_map[pid], payload.user_region,
                              payload.preferred_category, payload.price_tier,
                              payload.gi_preference)
            for pid in candidates
        ], dtype=np.float32)

        click_probs = ranker.predict_proba(feat_rows)[:, 1]

        # Blend retrieval cosine score (30%) + ranker click-prob (70%)
        final_scores = {}
        for i, pid in enumerate(candidates):
            final_scores[pid] = round(
                0.30 * retrieval_scores[pid] + 0.70 * float(click_probs[i]), 4
            )

        ranked = sorted(final_scores, key=final_scores.get, reverse=True)

        # Build response objects
        recommendations = []
        for pid in ranked[:top_k]:
            prod = prod_map[pid]
            recommendations.append({
                "id":            pid,
                "name":          prod["name"],
                "category":      prod["category"],
                "region":        prod["region"],
                "price_inr":     prod["price"],
                "gi_tag":        prod["gi"],
                "material":      prod["material"],
                "relevance_score": final_scores[pid],
                "match_reason":  _match_reason(prod, payload),
            })

        return {
            "recommendations":  recommendations,
            "also_bought":      [],
            "model_accuracy":   metrics.get("verified_accuracy"),
            "evaluation_metrics": metrics,
            "is_simulated":     False,
        }

    except Exception as exc:
        print(f"Recommendation inference failed, falling back: {exc}")
        return _fallback_recommendations(payload)


def get_similar_items(product_id: str, limit: int = 5) -> dict:
    """
    Return items frequently bought together with a given product,
    using the pre-computed co-purchase similarity matrix.
    """
    limit = min(max(1, limit), 10)

    if _model is None:
        return {"product_id": product_id, "similar_items": [],
                "model_accuracy": None, "is_simulated": True}

    try:
        similar    = _model["similar_items"]
        metrics    = _model["evaluation_metrics"]
        top_items  = similar.get(product_id, [])[:limit]

        return {
            "product_id":     product_id,
            "similar_items":  top_items,
            "model_accuracy": metrics.get("verified_accuracy"),
            "is_simulated":   False,
        }

    except Exception as exc:
        print(f"Similar items lookup failed: {exc}")
        return {"product_id": product_id, "similar_items": [],
                "model_accuracy": None, "is_simulated": True}


# -- Helper --------------------------------------------------------------------

def _match_reason(prod: dict, payload: RecommendationInput) -> str:
    reasons = []
    if prod["category"] == payload.preferred_category:
        reasons.append(f"matches your interest in {prod['category']}")
    if prod["region"] == payload.user_region:
        reasons.append(f"crafted in {prod['region']}")
    if prod["gi"] and payload.gi_preference:
        reasons.append("GI-certified")
    if _price_tier(prod["price"]) == payload.price_tier:
        reasons.append(f"{payload.price_tier} price range")
    return "; ".join(reasons) if reasons else "personalised for you"
