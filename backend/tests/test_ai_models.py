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