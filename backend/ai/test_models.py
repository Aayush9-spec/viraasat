import sys
import os

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from ai.pricing import PricePredictionInput, calculate_predicted_price
from ai.forecasting import calculate_demand_forecast
from ai.fraud import ReviewAnomalyInput, detect_review_fraud
from ai.blockchain import get_or_create_ledger, perform_transfer_ownership, is_chain_valid
from ai.graph import traverse_knowledge_graph

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
    assert len(ledger) == 3
    assert is_chain_valid(ledger) is True
    
    # 3. Mine ownership transfer block
    transfer_res = perform_transfer_ownership(product_id, "Buyer Alice", 12500.00)
    print("Mined Block Result:", transfer_res)
    assert transfer_res["status"] == "success"
    
    # 4. Validate updated ledger
    updated_ledger = get_or_create_ledger(product_id)
    assert len(updated_ledger) == 4
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

if __name__ == "__main__":
    try:
        test_pricing()
        test_forecasting()
        test_fraud()
        test_blockchain()
        test_graph()
        print("\nALL AI, BLOCKCHAIN & GRAPH CORE MODEL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print("\nTEST FAILED:", e)
        sys.exit(1)
