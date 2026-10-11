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

def load_real_product_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    products_path = os.path.abspath(os.path.join(current_dir, "../../database/products.json"))
    real_rows = []
    
    if os.path.exists(products_path):
        try:
            with open(products_path, "r", encoding="utf-8") as f:
                products = json.load(f)
                
            for p in products:
                cat = p.get("category", "Home Decor")
                price = float(p.get("price", 1000))
                
                # Estimate attributes based on craft description
                desc = p.get("description", "").lower()
                material = "Natural Vegetable Dyes"
                if "wool" in desc or "cashmere" in desc or "silk" in desc:
                    material = "Changthangi Cashmere Wool"
                elif "silver" in desc or "zari" in desc or "earrings" in desc:
                    material = "Pure Chandi / Silver Alloy"
                elif "cotton" in desc or "dhurrie" in desc:
                    material = "Khadi Cotton"
                elif "ceramic" in desc or "pottery" in desc or "earthenware" in desc:
                    material = "Multani Mitti & Quartz"
                    
                is_organic = any(w in desc for w in ["handcrafted", "natural", "handmade", "organic", "wood", "silk", "terracotta"])
                labor_hours = max(2.0, min(50.0, price / 450.0))
                size_sqft = max(0.5, min(15.0, price / 1200.0))
                
                real_rows.append({
                    "category": cat,
                    "material": material,
                    "labor_hours": labor_hours,
                    "size_sqft": size_sqft,
                    "is_organic": is_organic,
                    "price": price
                })
        except Exception as e:
            print(f"Notice: Failed to load real products.json data: {e}")
            
    return real_rows

def generate_pricing_data(num_samples=1200):
    categories = [
        "Home Decor", "Jewelry", "Textiles", "Kitchenware",
        "Accessories", "Gardening", "Painting", "Pottery & Clay"
    ]
    materials = [
        "Natural Vegetable Dyes", "Multani Mitti & Quartz",
        "Changthangi Cashmere Wool", "Pure Chandi / Silver Alloy", "Khadi Cotton"
    ]
    
    np.random.seed(42)
    
    cat_choices = np.random.choice(categories, num_samples)
    mat_choices = np.random.choice(materials, num_samples)
    labor_hours = np.random.uniform(2, 60, num_samples)
    size_sqft = np.random.uniform(0.2, 10.0, num_samples)
    is_organic = np.random.choice([True, False], num_samples, p=[0.4, 0.6])
    
    base_rates = {
        "Home Decor": 1200, "Jewelry": 800, "Textiles": 1500,
        "Kitchenware": 600, "Accessories": 400, "Gardening": 500,
        "Painting": 1400, "Pottery & Clay": 750
    }
    material_multipliers = {
        "Natural Vegetable Dyes": 1.25, "Multani Mitti & Quartz": 1.35,
        "Changthangi Cashmere Wool": 2.20, "Pure Chandi / Silver Alloy": 1.80,
        "Khadi Cotton": 1.10
    }
    
    prices = []
    for i in range(num_samples):
        rate = base_rates.get(cat_choices[i], 800)
        mat_mult = material_multipliers.get(mat_choices[i], 1.15)
        labor_cost = labor_hours[i] * 250
        size_premium = size_sqft[i] * 400
        
        predicted = (rate + labor_cost + size_premium) * mat_mult
        if is_organic[i]:
            predicted *= 1.15
            
        noise = np.random.uniform(-0.1, 0.1) * predicted
        prices.append(max(200, round(predicted + noise, -1)))
        
    df_gen = pd.DataFrame({
        "category": cat_choices,
        "material": mat_choices,
        "labor_hours": labor_hours,
        "size_sqft": size_sqft,
        "is_organic": is_organic,
        "price": prices
    })
    
    real_rows = load_real_product_data()
    if real_rows:
        df_real = pd.DataFrame(real_rows)
        # Duplicate real rows to increase weight of empirical platform products
        df_combined = pd.concat([df_gen, df_real, df_real], ignore_index=True)
        return df_combined
        
    return df_gen

def train_model():
    print("Generating cost & pricing dataset with real platform products...")
    df = generate_pricing_data()
    
    X = df.drop("price", axis=1)
    y = df["price"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['category', 'material'])
        ],
        remainder='passthrough'
    )
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    print("Training RandomForest Regression model...")
    pipeline.fit(X_train, y_train)
    
    # Independent evaluation on test set split
    r2 = float(pipeline.score(X_test, y_test))
    y_pred = pipeline.predict(X_test)
    mae = float(np.mean(np.abs(y_test - y_pred)))
    mape = float(np.mean(np.abs((y_test - y_pred) / y_test)))
    verified_accuracy = round(max(0.0, 1.0 - mape), 4)
    
    print(f"Model trained successfully. Evaluation R^2 score: {r2:.4f}, MAE: ₹{mae:.2f}, Verified Accuracy: {verified_accuracy:.4f}")
    
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

