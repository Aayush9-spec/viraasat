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
    regions = ["Rajasthan", "Kashmir", "Kutch", "Bihar"]
    categories = ["Home Decor", "Jewelry", "Textiles", "Kitchenware", "Accessories", "Gardening"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    np.random.seed(42)
    data = []
    
    # Generate data for the past 3 years to learn seasonal patterns
    for year in range(2023, 2026):
        for month_idx, month in enumerate(months):
            # Base seasonal demand index curve
            base_demand = [45, 50, 48, 40, 35, 30, 38, 55, 62, 85, 95, 80]
            
            for region in regions:
                region_mult = {"Rajasthan": 1.2, "Kashmir": 1.3, "Kutch": 1.1, "Bihar": 0.95}.get(region, 1.0)
                
                for category in categories:
                    cat_mod = 1.0
                    if category == "Textiles" or region == "Kashmir":
                        # Textiles peak in winter
                        winter_modifiers = [1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.7, 1.0, 1.1, 1.3, 1.5, 1.6]
                        cat_mod = winter_modifiers[month_idx]
                        
                    raw_val = base_demand[month_idx] * region_mult * cat_mod
                    # Add noise
                    noise = np.random.uniform(-4, 4)
                    demand_index = max(10, round(raw_val + noise, 1))
                    
                    # Tourist inflow
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
    print("Generating synthetic demand historical dataset...")
    df = generate_synthetic_data()
    
    X = df[["region", "category", "month"]]
    y_demand = df["demand_index"]
    y_tourist = df["tourist_inflow_k"]
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['region', 'category', 'month'])
        ]
    )
    
    # Train separate models for demand and tourist inflow
    pipeline_demand = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])
    
    pipeline_tourist = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])
    
    print("Training Ridge regression forecasting models...")
    pipeline_demand.fit(X, y_demand)
    pipeline_tourist.fit(X, y_tourist)
    
    # Evaluate on self (using as a curve fitter for time cycles)
    r2_demand = pipeline_demand.score(X, y_demand)
    r2_tourist = pipeline_tourist.score(X, y_tourist)
    print(f"Demand index R^2 fit: {r2_demand:.4f}")
    print(f"Tourist inflow R^2 fit: {r2_tourist:.4f}")
    
    # Save both models
    os.makedirs("backend/data", exist_ok=True)
    model_path = "backend/data/forecasting_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({
            "demand": pipeline_demand,
            "tourist": pipeline_tourist
        }, f)
    print(f"Models saved to {model_path}")

if __name__ == "__main__":
    train_model()
