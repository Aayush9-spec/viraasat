import os
import pickle
import pandas as pd
from pydantic import BaseModel

class PricePredictionInput(BaseModel):
    category: str
    material: str
    labor_hours: float
    size_sqft: float
    is_organic: bool = True

# Load the trained RandomForestRegressor pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(current_dir, "../../database/pricing_model.pkl"))
model = None

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print("ML Pricing Model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load ML Pricing Model: {e}")

def calculate_predicted_price(payload: PricePredictionInput) -> dict:
    # Heuristics for fallback and calculations
    labor_cost = payload.labor_hours * 250  # ₹250 per hour
    
    base_rates = {
        "Home Decor": 1200, "Jewelry": 800, "Textiles": 1500,
        "Kitchenware": 600, "Accessories": 400, "Gardening": 500
    }
    material_multiplier = {
        "Natural Vegetable Dyes": 1.25, "Multani Mitti & Quartz": 1.35,
        "Changthangi Cashmere Wool": 2.20, "Pure Chandi / Silver Alloy": 1.80,
        "Khadi Cotton": 1.10
    }
    
    rate = base_rates.get(payload.category, 600)
    mat_mult = material_multiplier.get(payload.material, 1.0)
    
    if model is not None:
        try:
            # Construct DataFrame for Scikit-Learn Pipeline
            input_df = pd.DataFrame([{
                "category": payload.category,
                "material": payload.material,
                "labor_hours": payload.labor_hours,
                "size_sqft": payload.size_sqft,
                "is_organic": payload.is_organic
            }])
            predicted = model.predict(input_df)[0]
        except Exception as e:
            print(f"Prediction failed, falling back to heuristics. Error: {e}")
            size_premium = payload.size_sqft * 400
            predicted = (rate + labor_cost + size_premium) * mat_mult
            if payload.is_organic:
                predicted *= 1.15
    else:
        size_premium = payload.size_sqft * 400
        predicted = (rate + labor_cost + size_premium) * mat_mult
        if payload.is_organic:
            predicted *= 1.15
            
    min_price = round(predicted * 0.95, -1)
    max_price = round(predicted * 1.05, -1)
    recommended = round(predicted, -1)
    
    return {
        "recommended_price": recommended,
        "price_range": {"min": min_price, "max": max_price},
        "labor_cost": round(labor_cost, -1),
        "material_factor": round(mat_mult, 2),
        "sustainability_premium": round(predicted * 0.15, -1) if payload.is_organic else 0
    }

