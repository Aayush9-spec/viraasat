import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

def detect_tier_for_desc(name: str, desc: str, cat: str, size: float, labor: float) -> str:
    text = f"{name} {desc}".lower()
    micro_keywords = [
        "diya", "deepam", "deepak", "kullhad", "kulhad", "coaster", "incense",
        "agarbatti", "keychain", "magnet", "bookmark", "clay cup", "bell",
        "earthen lamp", "terracotta lamp", "candle holder"
    ]
    if any(w in text for w in micro_keywords):
        return "micro"

    heritage_keywords = [
        "saree", "sari", "pashmina", "shawl", "marble inlay", "pietra dura",
        "bronze", "statue", "idol", "chariot", "carpet", "tapestry", "zari"
    ]
    if any(w in text for w in heritage_keywords):
        return "heritage"

    small_keywords = [
        "bangle", "bracelet", "earring", "jhumka", "toy", "doll", "pouch",
        "stencil", "ornament", "spoon", "comb", "mug", "pottery cup"
    ]
    if any(w in text for w in small_keywords):
        return "small"

    if size <= 0.3 and labor <= 3.0:
        return "micro"
    if labor > 18.0 or size > 8.0:
        return "heritage"
    if size <= 1.0 and labor <= 5.0 and cat in ["Accessories", "Jewelry", "Kitchenware"]:
        return "small"

    return "medium"

def load_real_product_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    products_path = os.path.abspath(os.path.join(current_dir, "../../database/products.json"))
    real_rows = []

    if os.path.exists(products_path):
        try:
            with open(products_path, "r", encoding="utf-8") as f:
                products = json.load(f)

            for p in products:
                name = p.get("name", "")
                cat = p.get("category", "Home Decor")
                price = float(p.get("price", 1000))
                desc = p.get("description", "").lower()

                material = "Natural Vegetable Dyes"
                if "wool" in desc or "cashmere" in desc or "pashmina" in desc:
                    material = "Changthangi Cashmere Wool"
                elif "silver" in desc or "zari" in desc or "earrings" in desc:
                    material = "Pure Chandi / Silver Alloy"
                elif "brass" in desc or "bronze" in desc:
                    material = "Brass & Bell Metal"
                elif "wood" in desc or "sheesham" in desc:
                    material = "Sheesham & Teak Wood"
                elif "cotton" in desc or "dhurrie" in desc or "chikan" in desc:
                    material = "Khadi Cotton"
                elif "jute" in desc or "bamboo" in desc:
                    material = "Jute & Bamboo"
                elif "terracotta" in desc or "clay" in desc or "earthenware" in desc:
                    material = "Terracotta & Natural Clay"
                elif "ceramic" in desc or "pottery" in desc:
                    material = "Multani Mitti & Quartz"

                is_organic = any(w in desc for w in ["handcrafted", "natural", "handmade", "organic", "wood", "silk", "terracotta", "clay"])
                labor_hours = max(1.0, min(50.0, price / 180.0))
                size_sqft = max(0.2, min(12.0, price / 400.0))
                tier = detect_tier_for_desc(name, desc, cat, size_sqft, labor_hours)

                real_rows.append({
                    "category": cat,
                    "material": material,
                    "labor_hours": labor_hours,
                    "size_sqft": size_sqft,
                    "is_organic": is_organic,
                    "tier": tier,
                    "price": price
                })
        except Exception as e:
            print(f"Notice: Failed to load real products.json data: {e}")

    return real_rows

def generate_pricing_data(num_samples=2500):
    categories = [
        "Home Decor", "Jewelry", "Textiles", "Kitchenware",
        "Accessories", "Gardening", "Painting", "Pottery & Clay"
    ]
    materials = [
        "Terracotta & Natural Clay", "Multani Mitti & Quartz",
        "Brass & Bell Metal", "Sheesham & Teak Wood",
        "Natural Vegetable Dyes", "Khadi Cotton",
        "Pure Chandi / Silver Alloy", "Changthangi Cashmere Wool",
        "Jute & Bamboo"
    ]
    tiers = ["micro", "small", "medium", "heritage"]
    tier_probs = [0.25, 0.30, 0.30, 0.15]

    np.random.seed(42)

    tier_choices = np.random.choice(tiers, num_samples, p=tier_probs)
    cat_choices = np.random.choice(categories, num_samples)
    mat_choices = np.random.choice(materials, num_samples)
    is_organic = np.random.choice([True, False], num_samples, p=[0.7, 0.3])

    labor_hours_list = []
    size_sqft_list = []
    prices = []

    for i in range(num_samples):
        tier = tier_choices[i]
        cat = cat_choices[i]
        mat = mat_choices[i]
        org = is_organic[i]

        if tier == "micro":
            labor = np.random.uniform(0.5, 3.5)
            size = np.random.uniform(0.1, 1.0)
            base = 35.0
            wage = 55.0
            size_cost = size * 20.0
            mat_cost = 25.0 if "Clay" in mat or "Mitti" in mat or "Jute" in mat else 45.0
            calc = base + (labor * wage) + size_cost + mat_cost
            if org:
                calc *= 1.08
            noise = np.random.uniform(-0.1, 0.1) * calc
            price = max(60.0, min(450.0, round(calc + noise, -1)))

        elif tier == "small":
            labor = np.random.uniform(1.5, 7.0)
            size = np.random.uniform(0.2, 2.0)
            base = 80.0
            wage = 75.0
            size_cost = size * 45.0
            mat_cost = 250.0 if "Silver" in mat else (120.0 if "Wood" in mat or "Brass" in mat else 60.0)
            calc = base + (labor * wage) + size_cost + mat_cost
            if org:
                calc *= 1.08
            noise = np.random.uniform(-0.12, 0.12) * calc
            price = max(150.0, min(950.0, round(calc + noise, -1)))

        elif tier == "medium":
            labor = np.random.uniform(3.0, 14.0)
            size = np.random.uniform(0.5, 4.5)
            base = 180.0
            wage = 90.0
            size_cost = size * 90.0
            mat_cost = 600.0 if "Silver" in mat or "Brass" in mat else 140.0
            calc = base + (labor * wage) + size_cost + mat_cost
            if org:
                calc *= 1.08
            noise = np.random.uniform(-0.12, 0.12) * calc
            price = max(350.0, min(2500.0, round(calc + noise, -1)))

        else: # heritage
            labor = np.random.uniform(12.0, 45.0)
            size = np.random.uniform(1.5, 10.0)
            base = 650.0
            wage = 135.0
            size_cost = size * 200.0
            mat_cost = 2800.0 if "Cashmere" in mat or "Silver" in mat else 700.0
            calc = base + (labor * wage) + size_cost + mat_cost
            if org:
                calc *= 1.08
            noise = np.random.uniform(-0.15, 0.15) * calc
            price = max(1800.0, min(35000.0, round(calc + noise, -1)))

        labor_hours_list.append(round(labor, 1))
        size_sqft_list.append(round(size, 2))
        prices.append(int(price))

    df_gen = pd.DataFrame({
        "category": cat_choices,
        "material": mat_choices,
        "labor_hours": labor_hours_list,
        "size_sqft": size_sqft_list,
        "is_organic": is_organic,
        "tier": tier_choices,
        "price": prices
    })

    real_rows = load_real_product_data()
    if real_rows:
        df_real = pd.DataFrame(real_rows)
        # Duplicate real rows to calibrate to platform catalog
        df_combined = pd.concat([df_gen, df_real, df_real, df_real], ignore_index=True)
        return df_combined

    return df_gen

def train_model():
    print("Generating Indian local artisan pricing dataset...")
    df = generate_pricing_data()

    X = df.drop("price", axis=1)
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['category', 'material', 'tier'])
        ],
        remainder='passthrough'
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=120, max_depth=16, random_state=42))
    ])

    print("Training RandomForest Regression model on Indian artisan dataset...")
    pipeline.fit(X_train, y_train)

    # Independent evaluation on test set split
    r2 = float(pipeline.score(X_test, y_test))
    y_pred = pipeline.predict(X_test)
    mae = float(np.mean(np.abs(y_test - y_pred)))
    mape = float(np.mean(np.abs((y_test - y_pred) / y_test)))
    verified_accuracy = round(max(0.0, 1.0 - mape), 4)

    print(f"Model trained successfully. Evaluation R^2 score: {r2:.4f}, MAE: Rs.{mae:.2f}, Verified Accuracy: {verified_accuracy:.4f}")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.abspath(os.path.join(current_dir, "../../database"))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "pricing_model.pkl")

    evaluation_metrics = {
        "r2_score": round(r2, 4),
        "mae": round(mae, 2),
        "mape": round(mape, 4),
        "verified_accuracy": verified_accuracy,
        "is_evaluated": True
    }

    with open(model_path, "wb") as f:
        pickle.dump({
            "pipeline": pipeline,
            "evaluation_metrics": evaluation_metrics
        }, f)
    print(f"Pricing model saved with evaluation metrics to {model_path}")

if __name__ == "__main__":
    train_model()
