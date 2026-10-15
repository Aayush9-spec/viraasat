import os
import pickle
import random
import pandas as pd

# Load the trained Ridge forecasting pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(current_dir, "../../../../database/forecasting_model.pkl")),
    os.path.abspath(os.path.join(current_dir, "../../database/forecasting_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/forecasting_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/forecasting_model.pkl"))
]
MODEL_PATH = next((x for x in MODEL_CANDIDATES if os.path.exists(x)), MODEL_CANDIDATES[0])
model = None

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print("ML Forecasting Model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load ML Forecasting Model: {e}")

def calculate_demand_forecast(region: str, category: str) -> dict:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    forecast = []
    
    # Generate warnings
    warnings = []
    if category == "Textiles" and region == "Kashmir":
        warnings.append("High winter demand ahead: Source Pashmina wool raw materials by August to avoid pricing spikes.")
    elif category == "Home Decor" and region == "Rajasthan":
        warnings.append("Diwali festival spikes demand: Recommended to double production batches for Blue Pottery vases.")
        
    if model is not None:
        try:
            # Construct DataFrame for predictions
            input_data = []
            for month in months:
                input_data.append({
                    "region": region,
                    "category": category,
                    "month": month
                })
            input_df = pd.DataFrame(input_data)
            
            demand_preds = model["demand"].predict(input_df)
            tourist_preds = model["tourist"].predict(input_df)
            
            for i, month in enumerate(months):
                forecast.append({
                    "month": month,
                    "demand_index": round(max(10.0, float(demand_preds[i])), 1),
                    "tourist_inflow_k": round(max(10.0, float(tourist_preds[i])))
                })
                
            eval_metrics = model.get("evaluation_metrics") if isinstance(model, dict) else None
            verified_acc = eval_metrics.get("verified_accuracy") if eval_metrics else None
            
            return {
                "region": region,
                "category": category,
                "time_series": forecast,
                "model_accuracy": verified_acc,
                "evaluation_metrics": eval_metrics,
                "warnings": warnings,
                "is_simulated": False
            }
        except Exception as e:
            print(f"Forecasting prediction failed, falling back. Error: {e}")
            
    # Fallback to simulated heuristics
    base_demand = [45, 50, 48, 40, 35, 30, 38, 55, 62, 85, 95, 80]
    region_multiplier = {
        "Rajasthan": 1.2,
        "Kashmir": 1.3,
        "Kutch": 1.1,
        "Bihar": 0.95
    }
    mult = region_multiplier.get(region, 1.0)
    
    category_modifier = [1.0] * 12
    if category == "Textiles" or region == "Kashmir":
        category_modifier = [1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.7, 1.0, 1.1, 1.3, 1.5, 1.6]
        
    for i, month in enumerate(months):
        raw_val = base_demand[i] * mult * category_modifier[i]
        deviation = random.uniform(-3, 3)
        forecast.append({
            "month": month,
            "demand_index": round(max(10, raw_val + deviation), 1),
            "tourist_inflow_k": round(150 * mult * (1.5 if i in [9, 10, 11, 0] else 0.6))
        })
        
    return {
        "region": region,
        "category": category,
        "time_series": forecast,
        "model_accuracy": None,
        "evaluation_metrics": None,
        "warnings": warnings,
        "is_simulated": True
    }


