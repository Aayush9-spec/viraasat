import sys
import os

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from ai.pricing import PricePredictionInput, calculate_predicted_price
from ai.forecasting import calculate_demand_forecast
from ai.fraud import ReviewAnomalyInput, detect_review_fraud
from ai.blockchain import get_or_create_ledger, perform_transfer_ownership, is_chain_valid
from ai.graph import traverse_knowledge_graph
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

def test_pricing():
    print("\n--- Testing Pricing Model ---")
    payload = PricePredictionInput(
        category="Textiles",
        material="Changthangi Cashmere Wool",
        labor_hours=15.0,
        size_sqft=2.5,
        is_organic=True
    )
    result = calculate_predicted_price(payload)
    print("Result:", result)
    assert result["recommended_price"] > 0
    print("Pricing model check passed.")

def test_forecasting():
    print("\n--- Testing Demand Forecasting Model ---")
    result = calculate_demand_forecast("Kashmir", "Textiles")
    print("Result (keys):", result.keys())
    print("Time series samples:", result["time_series"][:3])
    assert len(result["time_series"]) == 12
    assert result["is_simulated"] is False
    print("Forecasting model check passed.")

def test_fraud():
    print("\n--- Testing Fraud Detection Model ---")
    clean_payload = ReviewAnomalyInput(
        seller_id="seller-1",
        reviewer_id="reviewer-1",
        rating=5,
        review_text="This handwoven carpet is absolutely gorgeous, the weave quality is amazing!"
    )
    fraud_payload = ReviewAnomalyInput(
        seller_id="seller-1",
        reviewer_id="reviewer-2",
        rating=1,
        review_text="buy discount cheap click here paypal refund"
    )
    
    clean_result = detect_review_fraud(clean_payload)
    fraud_result = detect_review_fraud(fraud_payload)
    
    print("Clean review result:", clean_result)
    print("Fraud review result:", fraud_result)
    
    assert clean_result["is_fraudulent"] is False
    assert fraud_result["is_fraudulent"] is True
    print("Fraud model check passed.")

def test_blockchain():
    print("\n--- Testing Blockchain Provenance Engine ---")
    import time

    # A unique product id per run keeps this deterministic under both the
    # SQLite default and the in-memory store used by pytest (never pollutes
    # the committed seed ledger).
    product_id = f"test-prod-{int(time.time() * 1000)}"

    # 2. Get/create chain
    ledger = get_or_create_ledger(product_id)
    print(f"Genesis blockchain created. Length: {len(ledger)}")
    assert len(ledger) == 1
    assert is_chain_valid(ledger) is True
    
    # 3. Mine ownership transfer block
    transfer_res = perform_transfer_ownership(product_id, "Buyer Alice", 12500.00, caller_id="unassigned")
    print("Mined Block Result:", transfer_res)
    assert transfer_res["status"] == "success"
    
    # 4. Validate updated ledger
    updated_ledger = get_or_create_ledger(product_id)
    assert len(updated_ledger) == 2
    assert is_chain_valid(updated_ledger) is True
    
    print("Blockchain cryptographic hashing & block link checks passed.")

def test_graph():
    print("\n--- Testing NetworkX Graph Traverse ---")
    result = traverse_knowledge_graph("Pashmina")
    
    print("Matched nodes:", result["matched_nodes"])
    print("Connected nodes count:", len(result["connected_nodes"]))
    print("Centrality ranking:", result["centrality_ranking"])
    print("GI Certification paths:", result["gi_certification_paths"])
    
    assert len(result["matched_nodes"]) > 0
    assert len(result["connected_nodes"]) > 0
    assert len(result["centrality_ranking"]) > 0
    assert result["is_simulated"] is False
    print("NetworkX Graph traversal, degree centrality, and shortest-path checks passed.")

def test_market_prediction():
    print("\n--- Testing Market Prediction Ensemble ---")
    payload = MarketPredictionInput(
        product_name="Kashmir Pashmina Shawl",
        category="Textiles",
        region="Kashmir",
        base_price=5000.0,
        gi_tag=True,
        forecast_months=6,
    )
    res = predict_product_sales(payload)
    print("Market forecast:", res["product_name"], "Months:", len(res["forecast"]))
    assert res["is_simulated"] is False
    assert len(res["forecast"]) == 6

    trends = get_market_trends()
    print("Top sellers count:", len(trends["top_sellers"]))
    assert len(trends["top_sellers"]) > 0

    top_prods = get_top_products(category="Textiles", limit=3)
    print("Top products count:", len(top_prods["products"]))
    assert len(top_prods["products"]) > 0
    print("Market prediction checks passed.")

def test_recommendations():
    print("\n--- Testing Recommendation Two-Tower + Ranker ---")
    payload = RecommendationInput(
        user_region="Rajasthan",
        preferred_category="Home Decor",
        price_tier="mid",
        gi_preference=True,
        top_k=5,
    )
    res = get_recommendations(payload)
    print("Recommendations count:", len(res["recommendations"]))
    assert res["is_simulated"] is False
    assert len(res["recommendations"]) == 5

    sim = get_similar_items("prod-1", limit=3)
    print("Similar items for prod-1:", len(sim["similar_items"]))
    assert sim["is_simulated"] is False
    assert len(sim["similar_items"]) > 0
    print("Recommendation checks passed.")

def test_user_identification():
    print("\n--- Testing Promising User Identification ---")
    payload = UserBehaviorInput(
        user_id="artisan-supporter-1",
        recency_days=7,
        total_spend_inr=20000.0,
        purchase_count=8,
        is_verified=True,
    )
    res = score_user(payload)
    print("User score:", res["promising_score"], "Tier:", res["segment_tier"])
    assert res["is_simulated"] is False
    assert 0.0 <= res["promising_score"] <= 1.0

    overview = get_segment_overview()
    print("Segments count:", len(overview["segments"]))
    assert overview["is_simulated"] is False
    assert len(overview["segments"]) > 0
    print("User identification checks passed.")

if __name__ == "__main__":
    try:
        test_pricing()
        test_forecasting()
        test_fraud()
        test_blockchain()
        test_graph()
        test_market_prediction()
        test_recommendations()
        test_user_identification()
        print("\nALL AI, BLOCKCHAIN & GRAPH CORE MODEL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print("\nTEST FAILED:", e)
        sys.exit(1)
