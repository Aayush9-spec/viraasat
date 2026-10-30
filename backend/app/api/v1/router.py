import os
import sqlite3
import sys

# Ensure ai service directory is discoverable
_curr_dir = os.path.dirname(os.path.abspath(__file__))
_ai_dir = os.path.abspath(os.path.join(_curr_dir, "../../services"))
if _ai_dir not in sys.path:
    sys.path.insert(0, _ai_dir)

from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

from typing import Optional
from app.api.deps import get_current_user, get_optional_user, require_role
try:
    from ai.pricing import PricePredictionInput, calculate_predicted_price
    from ai.forecasting import calculate_demand_forecast
    from ai.graph import traverse_knowledge_graph
    from ai.search import semantic_product_search
    from ai.blockchain import get_existing_ledger, get_or_create_ledger, is_chain_valid, perform_transfer_ownership
    from ai.fraud import ReviewAnomalyInput, detect_review_fraud
    from ai.market_prediction import (
        MarketPredictionInput,
        predict_product_sales,
        get_market_trends,
        get_top_products,
    )
    from ai.recommendations import (
        RecommendationInput,
        get_recommendations,
        get_similar_items,
    )
    from ai.user_identification import (
        UserBehaviorInput,
        score_user,
        get_segment_overview,
    )
except ImportError:
    from app.services.ai.pricing import PricePredictionInput, calculate_predicted_price
    from app.services.ai.forecasting import calculate_demand_forecast
    from app.services.ai.graph import traverse_knowledge_graph
    from app.services.ai.search import semantic_product_search
    from app.services.ai.blockchain import get_existing_ledger, get_or_create_ledger, is_chain_valid, perform_transfer_ownership
    from app.services.ai.fraud import ReviewAnomalyInput, detect_review_fraud
    from app.services.ai.market_prediction import (
        MarketPredictionInput,
        predict_product_sales,
        get_market_trends,
        get_top_products,
    )
    from app.services.ai.recommendations import (
        RecommendationInput,
        get_recommendations,
        get_similar_items,
    )
    from app.services.ai.user_identification import (
        UserBehaviorInput,
        score_user,
        get_segment_overview,
    )

api_router = APIRouter()

# A local limiter instance is needed so we can use `@limiter.limit(...)`.
# It must share storage with the app's limiter (default in-memory works for
# single-process Render deployments; swap to Redis for multi-worker).
_limiter = Limiter(key_func=get_remote_address)


# ---- Public (read-only data lookups) ----
@api_router.post("/predict-price")
@_limiter.limit("30/minute")
async def predict_price(request: Request, payload: PricePredictionInput):
    return calculate_predicted_price(payload)


@api_router.get("/forecast-demand")
@_limiter.limit("30/minute")
async def forecast_demand(request: Request, region: str, category: str):
    return calculate_demand_forecast(region, category)


@api_router.get("/knowledge-graph/search")
@_limiter.limit("60/minute")
async def search_knowledge_graph(request: Request, query: str):
    return traverse_knowledge_graph(query)


@api_router.get("/search/semantic")
@_limiter.limit("60/minute")
async def semantic_search(request: Request, q: str):
    return semantic_product_search(q)


@api_router.get("/metrics/evaluation")
@_limiter.limit("60/minute")
async def get_evaluation_metrics(request: Request):
    import os, pickle
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(base_dir, "../../../../database")),
        os.path.abspath(os.path.join(base_dir, "../../database")),
        os.path.abspath(os.path.join(os.getcwd(), "../database")),
        os.path.abspath(os.path.join(os.getcwd(), "database")),
    ]
    db_dir = next((p for p in candidates if os.path.exists(p)), candidates[0])

    def _load_eval(filename: str):
        path = os.path.join(db_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    data = pickle.load(f)
                    if isinstance(data, dict):
                        return data.get("evaluation_metrics")
            except Exception:
                pass
        return None

    forecasting_eval = _load_eval("forecasting_model.pkl")
    pricing_eval     = _load_eval("pricing_model.pkl")
    fraud_eval       = _load_eval("fraud_model.pkl")
    market_eval      = _load_eval("market_prediction_model.pkl")
    rec_eval         = _load_eval("recommendation_model.pkl")
    user_eval        = _load_eval("user_identification_model.pkl")

    def measured(metrics, model_name, fields):
        metrics = metrics or {}
        return {"model_name": metrics.get("model_arch", model_name),
                "is_evaluated": bool(metrics), "verified_accuracy": metrics.get("verified_accuracy"),
                **{output: metrics.get(source) for output, source in fields.items()}}

    return {
        "recommendation_engine": measured(rec_eval, "Two-Tower NN + GBT Ranker", {
            "precision_at_10": "two_tower_precision_at_10", "recall_at_10": "recall_at_10",
            "map_score": "map_at_10", "ndcg_at_10": "ndcg_at_10", "dataset_size": "dataset_interactions"}),
        "demand_predictor": measured(forecasting_eval, "Ridge Regression", {
            "rmse": "demand_rmse", "mape": "demand_mape", "r2_score": "demand_r2"}),
        "market_predictor": measured(market_eval, "LSTM + GBT Ensemble", {
            "mape": "ensemble_mape", "gbt_r2_revenue": "gbt_r2_revenue"}),
        "user_segmentation": measured(user_eval, "GBT + K-Means", {
            "accuracy": "gbt_accuracy", "auc_roc": "gbt_auc_roc"}),
        "pricing_engine": measured(pricing_eval, "RandomForest Pricing Regressor", {
            "mae": "mae", "mape": "mape", "r2_score": "r2_score"}),
        "fraud_detector": measured(fraud_eval, "RandomForest Review Spam Classifier", {
            "accuracy": "accuracy", "precision": "precision", "recall": "recall", "f1_score": "f1_score"}),
        "computer_vision": {"model_name": "Provider vision inference", "is_evaluated": False,
                            "accuracy": None, "top5_accuracy": None, "f1_score": None},
        "system_telemetry": {"is_measured": False, "search_latency_ms": None,
                             "api_response_time_ms": None, "ai_inference_latency_ms": None, "total_uptime": None},
    }




# ---- Provenance: local ledger integrity is not physical authenticity ----
def ledger_response(product_id, chain):
    valid = bool(chain) and is_chain_valid(chain)
    return {"product_id": product_id, "ledger_chain": chain or [],
            "authenticity_score": 0,  # legacy field; no authenticity assessment exists
            "provenance_status": "Physical authenticity unverified",
            "integrity_status": "valid" if valid else "invalid" if chain else "unregistered",
            "blockchain_network": "Viraasat application ledger",
            "current_owner_id": chain[-1]["actor"] if valid else None}


@api_router.get("/blockchain/provenance/{product_id}")
@_limiter.limit("60/minute")
async def get_provenance(request: Request, product_id: str):
    return ledger_response(product_id, get_existing_ledger(product_id))


@api_router.post("/blockchain/generate/{product_id}")
@_limiter.limit("30/minute")
async def generate_provenance(request: Request, product_id: str,
                              user: dict = Depends(require_role("admin"))):
    # Registration assigns initial ledger custody to the signed-in registrar.
    # It does not attest to the product, seller, workshop or GI certification.
    if user.get("devBypass"):
        raise HTTPException(401, "A verified administrator session is required")
    existing = get_existing_ledger(product_id)
    chain = existing or get_or_create_ledger(product_id, user["userId"])
    return {**ledger_response(product_id, chain), "already_existed": bool(existing)}


from pydantic import BaseModel, Field

class TransferOwnershipInput(BaseModel):
    product_id: str = Field(min_length=1, max_length=200)
    new_owner: str = Field(pattern=r"^user_[A-Za-z0-9]+$", max_length=200)
    tx_value: float = Field(default=0, ge=0, allow_inf_nan=False)


@api_router.post("/blockchain/transfer")
@_limiter.limit("10/minute")
async def transfer_ownership(request: Request, payload: TransferOwnershipInput,
                             user: dict = Depends(get_current_user)):
    if user.get("devBypass"):
        raise HTTPException(401, "A verified session is required")
    if not get_existing_ledger(payload.product_id):
        raise HTTPException(404, "No provenance chain for this product")
    try:
        return perform_transfer_ownership(payload.product_id, payload.new_owner,
                                          payload.tx_value, caller_id=user["userId"])
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except (ValueError, sqlite3.IntegrityError) as exc:
        raise HTTPException(409, "Ledger changed or is invalid; reload before retrying") from exc


# ---- Fraud Detection ----
@api_router.post("/fraud/detect")
@_limiter.limit("30/minute")
async def detect_fraud(
    request: Request,
    payload: ReviewAnomalyInput,
    user: Optional[dict] = Depends(get_optional_user),
):
    return detect_review_fraud(payload)


# ---- Market Prediction (LSTM + GBT ensemble) ----
@api_router.post("/market/predict")
@_limiter.limit("30/minute")
async def market_predict(request: Request, payload: MarketPredictionInput):
    """
    Forecast units sold and revenue for a product over the next N months.
    Uses an LSTM + gradient-boosted tree ensemble trained on 3 years of
    Kaggle-style Indian handicrafts market data.
    """
    return predict_product_sales(payload)


@api_router.get("/market/trends")
@_limiter.limit("60/minute")
async def market_trends(request: Request):
    """
    Return platform-wide market trends: top sellers, top revenue products,
    monthly demand curve, and category performance rankings.
    """
    return get_market_trends()


@api_router.get("/market/top-products")
@_limiter.limit("60/minute")
async def market_top_products(
    request: Request,
    category: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = 10,
):
    """
    Return top N products ranked by 3-month projected sales, optionally
    filtered by category or region.
    """
    return get_top_products(category=category, region=region, limit=min(limit, 29))


# ---- Recommendations (Two-Tower + GBT ranker) ----
@api_router.post("/recommendations")
@_limiter.limit("30/minute")
async def recommendations(request: Request, payload: RecommendationInput):
    """
    Personalised product recommendations via Two-Tower retrieval (Stage 1)
    and GBT ranker (Stage 2). Returns top-K ranked items for the given user
    context (region, preferred category, price tier, GI preference).
    """
    return get_recommendations(payload)


@api_router.get("/recommendations/similar/{product_id}")
@_limiter.limit("60/minute")
async def similar_items(request: Request, product_id: str, limit: int = 5):
    """
    Items frequently bought together with the given product,
    derived from the co-purchase similarity matrix.
    """
    return get_similar_items(product_id, limit=min(limit, 10))


# ---- MLOps Health & Retraining Operations ----
@api_router.get("/health/models")
@_limiter.limit("60/minute")
async def models_health(request: Request):
    """
    MLOps observability endpoint: inspects all 7 model artifacts in database/,
    reporting their file modification age, training timestamp, evaluation
    metrics (accuracy, AUC, R2, P@10), and operational status.
    Replaces Prometheus/Grafana monitoring for Viraasat's scale.
    """
    import os, pickle, time
    from datetime import datetime

    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_dir = os.path.abspath(os.path.join(base_dir, "../../../database"))

    models_meta = [
        ("search_model", "search_model.pkl"),
        ("pricing_model", "pricing_model.pkl"),
        ("forecasting_model", "forecasting_model.pkl"),
        ("fraud_model", "fraud_model.pkl"),
        ("market_prediction_model", "market_prediction_model.pkl"),
        ("recommendation_model", "recommendation_model.pkl"),
        ("user_identification_model", "user_identification_model.pkl"),
    ]

    report = {}
    now = time.time()
    all_healthy = True

    for name, fname in models_meta:
        path = os.path.join(db_dir, fname)
        exists = os.path.exists(path)
        if not exists:
            report[name] = {"status": "missing", "path": path}
            all_healthy = False
            continue

        mtime = os.path.getmtime(path)
        size_bytes = os.path.getsize(path)
        age_hours = round((now - mtime) / 3600.0, 1)

        eval_metrics = None
        trained_at = None
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
                if isinstance(data, dict):
                    eval_metrics = data.get("evaluation_metrics")
                    trained_at = eval_metrics.get("trained_at") if eval_metrics else None
        except Exception:
            pass

        report[name] = {
            "status": "healthy",
            "file_size_kb": round(size_bytes / 1024.0, 1),
            "age_hours": age_hours,
            "file_modified_at": datetime.utcfromtimestamp(mtime).isoformat() + "Z",
            "trained_at": trained_at,
            "evaluation_metrics": eval_metrics,
        }

    return {
        "status": "operational" if all_healthy else "degraded",
        "database_dir": db_dir,
        "models": report,
        "checked_at": datetime.utcnow().isoformat() + "Z",
    }


@api_router.post("/admin/retrain")
@_limiter.limit("5/hour")
async def trigger_retrain(
    request: Request,
    background_tasks: BackgroundTasks,
    user: dict = Depends(require_role("admin")),
):
    """
    Trigger async master training pipeline in a FastAPI background task.
    Secured by admin role check and rate-limited to 5/hour.
    """
    import subprocess, sys

    def _run_train():
        try:
            script_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../../train_all.py")
            )
            subprocess.run([sys.executable, script_path], check=True)
        except Exception as e:
            print(f"Background retraining failed: {e}")

    background_tasks.add_task(_run_train)
    return {
        "status": "accepted",
        "message": "Master training pipeline triggered in background.",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

# ---- User Identification & Segmentation ----
@api_router.post("/user/score")
@_limiter.limit("60/minute")
async def user_score(request: Request, payload: UserBehaviorInput):
    """
    Score a user's behavioral vector via GBT classifier + K-Means clustering.
    Returns promising customer score, loyalty tier (Champion, Loyal, Promising, At Risk),
    and action triggers.
    """
    return score_user(payload)


@api_router.get("/user/segments")
@_limiter.limit("60/minute")
async def user_segments(request: Request):
    """
    Return platform-wide user segmentation overview, distribution, and cluster metrics.
    """
    return get_segment_overview()

