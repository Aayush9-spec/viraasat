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
    craftsmanship: str = "handmade"  # "handmade", "semi_handmade", "machine_assisted"
    name: str = ""
    description: str = ""
    region: str = ""

# Load the trained RandomForestRegressor pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(current_dir, "../../../../database/pricing_model.pkl")),
    os.path.abspath(os.path.join(current_dir, "../../database/pricing_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/pricing_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/pricing_model.pkl"))
]
MODEL_PATH = next((x for x in MODEL_CANDIDATES if os.path.exists(x)), MODEL_CANDIDATES[0])
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

    try:
        from ai.catalog import get_ml_config
    except ImportError:
        try:
            from app.services.ai.catalog import get_ml_config
        except ImportError:
            get_ml_config = None

    db_hourly_wage = float(get_ml_config("pricing.hourly_wage", 55.0)) if get_ml_config else 55.0
    db_base_overhead = float(get_ml_config("pricing.base_overhead", 35.0)) if get_ml_config else 35.0
    db_size_rate = float(get_ml_config("pricing.size_rate", 20.0)) if get_ml_config else 20.0

    # Indian artisan wage and baseline configurations per tier (grounded in database ML configs):
    tier_configs = {
        "micro": {
            "label": "Micro Craft / Devotional",
            "base_overhead": db_base_overhead,
            "hourly_wage": db_hourly_wage,
            "size_rate": db_size_rate,
            "mat_costs": {
                "Multani Mitti & Quartz": 25,
                "Terracotta & Natural Clay": 20,
                "Natural Vegetable Dyes": 20,
                "Khadi Cotton": 25,
                "Mulberry & Tussar Silk": 110,
                "Jute & Coir": 18,
                "Bamboo & Cane": 22,
                "Sheesham & Teak Wood": 40,
                "Sandalwood & Rosewood": 180,
                "Walnut Wood": 90,
                "Brass & Bell Metal": 70,
                "Copper & Bronze (Kansa)": 85,
                "Wrought Iron (Bastar Loha)": 45,
                "Pure Chandi / Silver Alloy": 250,
                "Makrana Marble & Soft Stone": 80,
                "Changthangi Cashmere Wool": 300,
                "Lac & Natural Resins": 30,
                "Glass & Mirror Beads": 25,
                "Vegetable Tanned Leather": 60,
                "Handmade Cotton Rag Paper": 20,
                "Sikki Grass & Sabai Grass": 18,
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
                "Mulberry & Tussar Silk": 240,
                "Jute & Coir": 40,
                "Bamboo & Cane": 50,
                "Sheesham & Teak Wood": 120,
                "Sandalwood & Rosewood": 400,
                "Walnut Wood": 220,
                "Brass & Bell Metal": 200,
                "Copper & Bronze (Kansa)": 220,
                "Wrought Iron (Bastar Loha)": 130,
                "Pure Chandi / Silver Alloy": 500,
                "Makrana Marble & Soft Stone": 180,
                "Changthangi Cashmere Wool": 700,
                "Lac & Natural Resins": 80,
                "Glass & Mirror Beads": 60,
                "Vegetable Tanned Leather": 150,
                "Handmade Cotton Rag Paper": 45,
                "Sikki Grass & Sabai Grass": 40,
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
                "Mulberry & Tussar Silk": 550,
                "Jute & Coir": 85,
                "Bamboo & Cane": 110,
                "Sheesham & Teak Wood": 280,
                "Sandalwood & Rosewood": 900,
                "Walnut Wood": 480,
                "Brass & Bell Metal": 450,
                "Copper & Bronze (Kansa)": 520,
                "Wrought Iron (Bastar Loha)": 320,
                "Pure Chandi / Silver Alloy": 1100,
                "Makrana Marble & Soft Stone": 420,
                "Changthangi Cashmere Wool": 1800,
                "Lac & Natural Resins": 160,
                "Glass & Mirror Beads": 140,
                "Vegetable Tanned Leather": 380,
                "Handmade Cotton Rag Paper": 110,
                "Sikki Grass & Sabai Grass": 90,
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
                "Mulberry & Tussar Silk": 1800,
                "Jute & Coir": 280,
                "Bamboo & Cane": 350,
                "Sheesham & Teak Wood": 950,
                "Sandalwood & Rosewood": 2600,
                "Walnut Wood": 1400,
                "Brass & Bell Metal": 1400,
                "Copper & Bronze (Kansa)": 1600,
                "Wrought Iron (Bastar Loha)": 900,
                "Pure Chandi / Silver Alloy": 2800,
                "Makrana Marble & Soft Stone": 1300,
                "Changthangi Cashmere Wool": 3800,
                "Lac & Natural Resins": 500,
                "Glass & Mirror Beads": 450,
                "Vegetable Tanned Leather": 1100,
                "Handmade Cotton Rag Paper": 320,
                "Sikki Grass & Sabai Grass": 280,
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

    # Craftsmanship wage multiplier:
    # - 100% handmade: full artisan honorarium (1.0x)
    # - Semi-handmade / Traditional handloom: 0.85x
    # - Machine-assisted: 0.50x
    craft_multiplier = 1.0
    craft_key = (payload.craftsmanship or "handmade").lower()
    if "machine" in craft_key:
        craft_multiplier = 0.50
    elif "semi" in craft_key or "loom" in craft_key:
        craft_multiplier = 0.85

    # Fair labor compensation based on realistic Indian artisan work hours and craftsmanship mode
    labor_cost = payload.labor_hours * wage_rate * craft_multiplier

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
