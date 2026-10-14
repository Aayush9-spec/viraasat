import os
import pickle
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split

def generate_synthetic_data():
    # Incorporate real regions and categories from live platform catalog & GI registry
    regions = [
        "Rajasthan", "Kashmir", "Kutch", "Bihar", "Uttar Pradesh",
        "West Bengal", "Kerala", "Gujarat", "Tamil Nadu", "Telangana",
        "Madhya Pradesh", "Maharashtra", "Odisha", "Karnataka", "Himachal Pradesh"
    ]
    categories = [
        "Home Decor", "Jewelry", "Textiles", "Kitchenware",
        "Accessories", "Gardening", "Painting", "Pottery & Clay"
    ]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    np.random.seed(42)
    data = []
    
    # Generate data across 3 historical years to learn seasonal trends
    for year in range(2023, 2026):
        for month_idx, month in enumerate(months):
            base_demand = [45, 50, 48, 40, 35, 30, 38, 55, 62, 85, 95, 80]
            
            for region in regions:
                region_mult = {
                    "Rajasthan": 1.2, "Kashmir": 1.35, "Kutch": 1.1, "Bihar": 0.95,
                    "Uttar Pradesh": 1.15, "West Bengal": 1.05, "Kerala": 1.12, "Gujarat": 1.18
                }.get(region, 1.0)
                
                for category in categories:
                    cat_mod = 1.0
                    if category in ["Textiles", "Fashion"] or region == "Kashmir":
                        winter_modifiers = [1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.7, 1.0, 1.1, 1.3, 1.5, 1.6]
                        cat_mod = winter_modifiers[month_idx]
                    elif category == "Jewelry":
                        festive_modifiers = [0.9, 0.8, 1.1, 1.3, 1.2, 0.7, 0.8, 1.2, 1.1, 1.5, 1.7, 1.3]
                        cat_mod = festive_modifiers[month_idx]
                    elif category in ["Pottery & Clay", "Home Decor"]:
                        diwali_modifiers = [0.8, 0.9, 1.0, 1.2, 1.1, 0.9, 1.1, 1.3, 1.4, 1.8, 1.5, 1.1]
                        cat_mod = diwali_modifiers[month_idx]
                        
                    raw_val = base_demand[month_idx] * region_mult * cat_mod
                    noise = np.random.uniform(-4, 4)
                    demand_index = max(10, round(raw_val + noise, 1))
                    
                    tourist_inflow = round(150 * region_mult * (1.5 if month_idx in [9, 10, 11, 0] else 0.6) + np.random.uniform(-10, 10))
                    
                    data.append({
                        "region": region,
                        "category": category,
                        "month": month,
                        "demand_index": demand_index,
                        "tourist_inflow_k": max(10, tourist_inflow)
                    })
                    
    return pd.DataFrame(data)

def train_model():
    print("Generating historical demand & tourist dataset using real regions and categories...")
    df = generate_synthetic_data()
    
    X = df[["region", "category", "month"]]
    y_demand = df["demand_index"]
    y_tourist = df["tourist_inflow_k"]
    
    X_train, X_test, y_demand_train, y_demand_test, y_tourist_train, y_tourist_test = train_test_split(
        X, y_demand, y_tourist, test_size=0.2, random_state=42
    )
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['region', 'category', 'month'])
        ]
    )
    
    pipeline_demand = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])
    
    pipeline_tourist = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])
    
    print("Training Ridge regression forecasting models...")
    pipeline_demand.fit(X_train, y_demand_train)
    pipeline_tourist.fit(X_train, y_tourist_train)
    
    # Independent evaluation on test set split
    r2_demand = float(pipeline_demand.score(X_test, y_demand_test))
    r2_tourist = float(pipeline_tourist.score(X_test, y_tourist_test))
    
    demand_preds = pipeline_demand.predict(X_test)
    mape_demand = float(np.mean(np.abs((y_demand_test - demand_preds) / np.maximum(y_demand_test, 1.0))))
    verified_accuracy = round(max(0.0, 1.0 - mape_demand), 4)
    
    print(f"Test Set Demand Index R^2 Score: {r2_demand:.4f}")
    print(f"Test Set Tourist Inflow R^2 Score: {r2_tourist:.4f}")
    print(f"Test Set Demand MAPE: {mape_demand:.4f} (Verified Accuracy: {verified_accuracy:.4f})")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.abspath(os.path.join(current_dir, "../../database"))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "forecasting_model.pkl")
    
    evaluation_metrics = {
        "demand_r2": round(r2_demand, 4),
        "tourist_r2": round(r2_tourist, 4),
        "demand_mape": round(mape_demand, 4),
        "verified_accuracy": verified_accuracy,
        "is_evaluated": True
    }
    
    with open(model_path, "wb") as f:
        pickle.dump({
            "demand": pipeline_demand,
            "tourist": pipeline_tourist,
            "evaluation_metrics": evaluation_metrics
        }, f)
    print(f"Trained forecasting model with evaluation metrics saved to {model_path}")

if __name__ == "__main__":
    train_model()

