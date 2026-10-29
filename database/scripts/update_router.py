import os
import sys

router_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/app/api/v1/router.py"))
with open(router_path, "r", encoding="utf-8") as f:
    content = f.read()

import_replacement = """import os
import sys

# Ensure ai service directory is discoverable
_curr_dir = os.path.dirname(os.path.abspath(__file__))
_ai_dir = os.path.abspath(os.path.join(_curr_dir, "../../services"))
if _ai_dir not in sys.path:
    sys.path.insert(0, _ai_dir)

from fastapi import APIRouter, Depends, Request, BackgroundTasks
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
"""

idx = content.find("api_router = APIRouter()")
if idx != -1:
    content = import_replacement + "\n" + content[idx:]

new_endpoints = """

# ---- User Identification & Segmentation ----
@api_router.post("/user/score")
@_limiter.limit("60/minute")
async def user_score(request: Request, payload: UserBehaviorInput):
    \"\"\"
    Score a user's behavioral vector via GBT classifier + K-Means clustering.
    Returns promising customer score, loyalty tier (Champion, Loyal, Promising, At Risk),
    and action triggers.
    \"\"\"
    return score_user(payload)


@api_router.get("/user/segments")
@_limiter.limit("60/minute")
async def user_segments(request: Request):
    \"\"\"
    Return platform-wide user segmentation overview, distribution, and cluster metrics.
    \"\"\"
    return get_segment_overview()
"""

if "/user/score" not in content:
    content = content.rstrip() + new_endpoints + "\n"

with open(router_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Router updated successfully!")
