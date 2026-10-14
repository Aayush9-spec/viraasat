import os
import re
import pickle
import pandas as pd
from pydantic import BaseModel

class PricePredictionInput(BaseModel):
    category: str
    material: str = "Natural Vegetable Dyes"
    labor_hours: float = 2.0
    size_sqft: float = 1.0
    is_organic: bool = True
    name: str = ""
    description: str = ""
    region: str = ""

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

def detect_craft_tier(name: str, desc: str, category: str, size_sqft: float, labor_hours: float) -> str:
    """
    Intelligently classify craft scale for Indian local artisans:
    - 'micro': Diyas, kullhads, coasters, clay lamps, incense holders, keychains, small bells (₹60 - ₹350)
    - 'small': Bangles, jhumkas, wooden toys, stencils, fabric pouches, small decor (₹180 - ₹700)
    - 'medium': Ceramic vases, terracotta planters, cushion covers, boxes, tableware (₹450 - ₹1,800)
    - 'heritage': Sarees, pashminas, marble inlay, large bronze/brass idols, tapestries (₹2,500 - ₹18,000+)
    """
    text = f"{name} {desc}".lower().strip()

    micro_keywords = [
        "diya", "deepam", "deepak", "kullhad", "kulhad", "coaster", "incense",
        "agarbatti", "keychain", "magnet", "bookmark", "clay cup", "bell",
        "earthen lamp", "terracotta lamp", "candle holder", "rakhi", "pendant"
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', text) for w in micro_keywords):
        return "micro"

    heritage_keywords = [
        "saree", "sari", "pashmina", "shawl", "marble inlay", "pietra dura",
        "bronze", "statue", "idol", "chariot", "carpet", "tapestry", "zari",
        "quilt", "silk saree", "large brass"
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', text) for w in heritage_keywords):
        return "heritage"

    small_keywords = [
        "bangle", "bracelet", "earring", "jhumka", "toy", "doll", "pouch",
        "stencil", "ornament", "spoon", "comb", "mug", "pottery cup", "mask"
    ]
    if any(re.search(r'\b' + re.escape(w) + r'\b', text) for w in small_keywords):
        return "small"

    # Contextual fallbacks based on physical scale and labor
    if size_sqft <= 0.3 and labor_hours <= 3.0:
        return "micro"
    if labor_hours > 18.0 or size_sqft > 8.0:
        return "heritage"
    if size_sqft <= 1.0 and labor_hours <= 5.0 and category in ["Accessories", "Jewelry", "Kitchenware"]:
        return "small"

    return "medium"

def calculate_predicted_price(payload: PricePredictionInput) -> dict:
    """
    Computes fair, realistic market pricing for Indian local artisans
    grounded in local wage standards, material costs, and authentic market demand.
    """
    tier = detect_craft_tier(
        payload.name,
        payload.description,
        payload.category,
        payload.size_sqft,
        payload.labor_hours
    )

    # Indian artisan wage and baseline configurations per tier:
    tier_configs = {
        "micro": {
            "label": "Micro Craft / Devotional",
            "base_overhead": 35,       # Kiln firing, preparation, packaging
            "hourly_wage": 55,         # Rural craft wage ₹50-60/hr
            "size_rate": 20,           # Minimal size surcharge
            "mat_costs": {
                "Multani Mitti & Quartz": 25,
                "Terracotta & Natural Clay": 20,
                "Natural Vegetable Dyes": 20,
                "Khadi Cotton": 25,
                "Jute & Bamboo": 20,
                "Sheesham & Teak Wood": 40,
                "Brass & Bell Metal": 70,
                "Pure Chandi / Silver Alloy": 250,
                "Changthangi Cashmere Wool": 300,
            },
            "default_mat_cost": 25,
            "min_floor": 60,
            "max_cap": 450,
        },
        "small": {
            "label": "Small Artisan Accessory / Craft",
            "base_overhead": 80,
            "hourly_wage": 75,
            "size_rate": 45,
            "mat_costs": {
                "Multani Mitti & Quartz": 60,
                "Terracotta & Natural Clay": 50,
                "Natural Vegetable Dyes": 50,
                "Khadi Cotton": 60,
                "Jute & Bamboo": 40,
                "Sheesham & Teak Wood": 120,
                "Brass & Bell Metal": 200,
                "Pure Chandi / Silver Alloy": 500,
                "Changthangi Cashmere Wool": 700,
            },
            "default_mat_cost": 60,
            "min_floor": 150,
            "max_cap": 950,
        },
        "medium": {
            "label": "Handcrafted Decor & Tableware",
            "base_overhead": 180,
            "hourly_wage": 90,
            "size_rate": 90,
            "mat_costs": {
                "Multani Mitti & Quartz": 140,
                "Terracotta & Natural Clay": 110,
                "Natural Vegetable Dyes": 90,
                "Khadi Cotton": 130,
                "Jute & Bamboo": 90,
                "Sheesham & Teak Wood": 280,
                "Brass & Bell Metal": 450,
                "Pure Chandi / Silver Alloy": 1100,
                "Changthangi Cashmere Wool": 1800,
            },
            "default_mat_cost": 140,
            "min_floor": 350,
            "max_cap": 2500,
        },
        "heritage": {
            "label": "Heritage Masterpiece / Luxury Craft",
            "base_overhead": 650,
            "hourly_wage": 135,
            "size_rate": 200,
            "mat_costs": {
                "Multani Mitti & Quartz": 450,
                "Terracotta & Natural Clay": 350,
                "Natural Vegetable Dyes": 350,
                "Khadi Cotton": 450,
                "Jute & Bamboo": 300,
                "Sheesham & Teak Wood": 950,
                "Brass & Bell Metal": 1400,
                "Pure Chandi / Silver Alloy": 2800,
                "Changthangi Cashmere Wool": 3800,
            },
            "default_mat_cost": 500,
            "min_floor": 1800,
            "max_cap": 35000,
        },
    }

    cfg = tier_configs.get(tier, tier_configs["medium"])
    base_cost = cfg["base_overhead"]
    wage_rate = cfg["hourly_wage"]
    size_rate = cfg["size_rate"]
    mat_cost = cfg["mat_costs"].get(payload.material, cfg["default_mat_cost"])

    # Fair labor compensation based on realistic Indian artisan work hours
    labor_cost = payload.labor_hours * wage_rate

    # Clamped size area cost to prevent explosive numbers on small crafts
    effective_size = max(0.1, min(payload.size_sqft, 10.0))
    size_cost = effective_size * size_rate

    # Calculate baseline production cost
    subtotal = base_cost + labor_cost + mat_cost + size_cost

    # Sustainability & organic artisan premium (modest, fair, and accessible)
    sustainability_premium = round(subtotal * 0.08, -1) if payload.is_organic else 0.0

    calculated_price = subtotal + sustainability_premium

    # Machine Learning adjustment if trained model is active
    predicted = None
    is_simulated = True
    eval_metrics = None

    if model is not None:
        try:
            if isinstance(model, dict):
                pipeline = model.get("pipeline", model)
                eval_metrics = model.get("evaluation_metrics")
            else:
                pipeline = model
                eval_metrics = None

            input_df = pd.DataFrame([{
                "category": payload.category,
                "material": payload.material,
                "labor_hours": payload.labor_hours,
                "size_sqft": payload.size_sqft,
                "is_organic": payload.is_organic,
                "tier": tier
            }])
            ml_pred = float(pipeline.predict(input_df)[0])
            
            # Blend ML prediction with domain heuristic to ensure strict sanity bounds
            predicted = 0.5 * ml_pred + 0.5 * calculated_price
            is_simulated = False
        except Exception:
            predicted = calculated_price
            is_simulated = True
    else:
        predicted = calculated_price
        is_simulated = True

    # Clamp within tier bounds to guarantee reasonable prices for Indian artisans
    clamped_price = max(cfg["min_floor"], min(predicted, cfg["max_cap"]))

    recommended = int(round(clamped_price, -1))
    min_price = int(round(recommended * 0.90, -1))
    max_price = int(round(recommended * 1.10, -1))

    # Calculate realistic material factor for UI display
    material_multiplier = round(1.0 + (mat_cost / max(1.0, subtotal)), 2)

    return {
        "recommended_price": recommended,
        "price_range": {
            "min": min_price,
            "max": max_price,
        },
        "labor_cost": int(round(labor_cost, -1)),
        "material_factor": material_multiplier,
        "craft_tier": cfg["label"],
        "sustainability_premium": int(round(sustainability_premium, -1)),
        "evaluation_metrics": eval_metrics,
        "is_simulated": is_simulated,
    }
