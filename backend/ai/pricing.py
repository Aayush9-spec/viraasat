from pydantic import BaseModel

class PricePredictionInput(BaseModel):
    category: str
    material: str
    labor_hours: float
    size_sqft: float
    is_organic: bool = True

def calculate_predicted_price(payload: PricePredictionInput) -> dict:
    base_rates = {
        "Home Decor": 1200,
        "Jewelry": 800,
        "Textiles": 1500,
        "Kitchenware": 600,
        "Accessories": 400,
        "Gardening": 500
    }
    material_multiplier = {
        "Natural Vegetable Dyes": 1.25,
        "Multani Mitti & Quartz": 1.35,
        "Changthangi Cashmere Wool": 2.20,
        "Pure Chandi / Silver Alloy": 1.80,
        "Khadi Cotton": 1.10
    }
    
    rate = base_rates.get(payload.category, 600)
    mat_mult = material_multiplier.get(payload.material, 1.0)
    
    labor_cost = payload.labor_hours * 250  # ₹250 per hour
    size_premium = payload.size_sqft * 400
    
    predicted = (rate + labor_cost + size_premium) * mat_mult
    if payload.is_organic:
        predicted *= 1.15  # 15% organic sourcing premium
        
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
