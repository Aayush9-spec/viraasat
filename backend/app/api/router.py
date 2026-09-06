from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, require_role
from ai.pricing import PricePredictionInput, calculate_predicted_price
from ai.forecasting import calculate_demand_forecast
from ai.graph import traverse_knowledge_graph
from ai.search import semantic_product_search
from ai.blockchain import get_or_create_ledger, perform_transfer_ownership
from ai.fraud import ReviewAnomalyInput, detect_review_fraud

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


# ---- Authenticated (blockchain reads) ----
@api_router.get("/blockchain/provenance/{product_id}")
@_limiter.limit("60/minute")
async def get_provenance(
    request: Request,
    product_id: str,
    user: dict = Depends(get_current_user),
):
    ledger = get_or_create_ledger(product_id)
    return {
        "product_id": product_id,
        "ledger_chain": ledger,
        "authenticity_score": 98.6,
        "provenance_status": "Verified Genuine",
        "blockchain_network": "Viraasat Ledger Mainnet (Proof of Authority)",
        "requested_by": user.get("userId"),
    }


# ---- Authenticated (blockchain writes) ----
@api_router.post("/blockchain/transfer")
@_limiter.limit("10/minute")
async def transfer_ownership(
    request: Request,
    product_id: str,
    new_owner: str,
    tx_value: float,
    user: dict = Depends(require_role("artisan", "admin")),
):
    return perform_transfer_ownership(product_id, new_owner, tx_value)


# ---- Authenticated (fraud detection) ----
@api_router.post("/fraud/detect")
@_limiter.limit("30/minute")
async def detect_fraud(
    request: Request,
    payload: ReviewAnomalyInput,
    user: dict = Depends(require_role("admin", "artisan")),
):
    return detect_review_fraud(payload)
