"""Shared pytest coverage for the AI model modules.

These mirror and extend the manual assertions in ai/test_models.py so the
suite runs under `pytest` as well.
"""
from ai.pricing import PricePredictionInput, calculate_predicted_price
from ai.forecasting import calculate_demand_forecast
from ai.fraud import ReviewAnomalyInput, detect_review_fraud
from ai.blockchain import get_or_create_ledger, perform_transfer_ownership, is_chain_valid
from ai.graph import traverse_knowledge_graph


def test_pricing_suggests_positive_price():
    payload = PricePredictionInput(
        category="Textiles",
        material="Changthangi Cashmere Wool",
        labor_hours=15.0,
        size_sqft=2.5,
        is_organic=True,
    )
    result = calculate_predicted_price(payload)
    assert result["recommended_price"] > 0
    assert result["price_range"]["max"] >= result["recommended_price"]
    assert result["price_range"]["min"] <= result["recommended_price"]


def test_pricing_is_labor_sensitive():
    cheap = calculate_predicted_price(
        PricePredictionInput(
            category="Home Decor",
            material="Clay",
            labor_hours=2.0,
            size_sqft=1.0,
            is_organic=False,
        )
    )
    expensive = calculate_predicted_price(
        PricePredictionInput(
            category="Home Decor",
            material="Clay",
            labor_hours=40.0,
            size_sqft=1.0,
            is_organic=False,
        )
    )
    assert expensive["recommended_price"] > cheap["recommended_price"]


def test_forecasting_returns_twelve_month_series():
    result = calculate_demand_forecast("Kashmir", "Textiles")
    assert len(result["time_series"]) == 12
    assert len(result["time_series"][0]["month"]) == 3
    assert result["time_series"][0]["demand_index"] > 0
    assert "model_accuracy" in result
    assert isinstance(result.get("warnings"), list)


def test_fraud_detects_spam():
    clean = ReviewAnomalyInput(
        seller_id="seller-1",
        reviewer_id="reviewer-1",
        rating=5,
        review_text="This handwoven carpet is gorgeous, the weave quality is amazing!",
    )
    spam = ReviewAnomalyInput(
        seller_id="seller-1",
        reviewer_id="reviewer-2",
        rating=1,
        review_text="buy discount cheap click here paypal refund",
    )
    assert detect_review_fraud(clean)["is_fraudulent"] is False
    assert detect_review_fraud(spam)["is_fraudulent"] is True


def test_blockchain_chain_validation():
    ledger = get_or_create_ledger("pytest-prod-1")
    assert len(ledger) == 3
    assert is_chain_valid(ledger) is True

    transfer = perform_transfer_ownership("pytest-prod-1", "Test Buyer", 500.0)
    assert transfer["status"] == "success"

    updated = get_or_create_ledger("pytest-prod-1")
    assert len(updated) == 4
    assert is_chain_valid(updated) is True


def test_knowledge_graph_traversal():
    result = traverse_knowledge_graph("Pashmina")
    assert len(result["matched_nodes"]) > 0
    assert len(result["connected_nodes"]) > 0
    assert len(result["centrality_ranking"]) > 0
    assert result["is_simulated"] is False


def test_market_prediction_forecast():
    from ai.market_prediction import MarketPredictionInput, predict_product_sales
    payload = MarketPredictionInput(
        product_name="Kashmir Pashmina Shawl",
        category="Textiles",
        region="Kashmir",
        base_price=5000.0,
        gi_tag=True,
        forecast_months=6,
    )
    result = predict_product_sales(payload)
    assert result["product_name"] == "Kashmir Pashmina Shawl"
    assert len(result["forecast"]) == 6
    assert result["total_predicted_units"] > 0
    assert result["total_predicted_revenue_inr"] > 0
    assert result["is_simulated"] is False


def test_market_trends_and_top_products():
    from ai.market_prediction import get_market_trends, get_top_products
    trends = get_market_trends()
    assert len(trends["top_sellers"]) > 0
    assert len(trends["monthly_trend"]) == 12
    assert trends["is_simulated"] is False

    top_prods = get_top_products(category="Textiles", limit=3)
    assert len(top_prods["products"]) <= 3
    for p in top_prods["products"]:
        assert p["category"].lower() == "textiles"


def test_recommendations_system():
    from ai.recommendations import RecommendationInput, get_recommendations, get_similar_items
    rec_input = RecommendationInput(
        user_region="Rajasthan",
        preferred_category="Home Decor",
        price_tier="mid",
        gi_preference=True,
        top_k=5,
    )
    result = get_recommendations(rec_input)
    assert len(result["recommendations"]) == 5
    assert result["is_simulated"] is False
    assert result["model_accuracy"] is not None

    similar = get_similar_items("prod-1", limit=3)
    assert similar["product_id"] == "prod-1"
    assert len(similar["similar_items"]) > 0
    assert similar["is_simulated"] is False


def test_user_identification_system():
    from ai.user_identification import UserBehaviorInput, score_user, get_segment_overview
    score_res = score_user(UserBehaviorInput(
        user_id="artisan-fan-99",
        recency_days=5,
        total_spend_inr=35000.0,
        purchase_count=12,
        is_verified=True,
    ))
    assert 0.0 <= score_res["promising_score"] <= 1.0
    assert isinstance(score_res["is_promising"], bool)
    assert score_res["segment_tier"] in ["Champion", "Loyal", "Promising", "Casual", "At Risk"]
    assert score_res["is_simulated"] is False

    overview = get_segment_overview()
    assert len(overview["segments"]) > 0
    assert overview["is_simulated"] is False