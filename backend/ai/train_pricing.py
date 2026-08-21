import os
import pickle
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

def generate_synthetic_data(num_samples=1000):
    categories = ["Home Decor", "Jewelry", "Textiles", "Kitchenware", "Accessories", "Gardening"]
    materials = ["Natural Vegetable Dyes", "Multani Mitti & Quartz", "Changthangi Cashmere Wool", "Pure Chandi / Silver Alloy", "Khadi Cotton"]
    
    np.random.seed(42)
    
    # Random feature generation
    cat_choices = np.random.choice(categories, num_samples)
    mat_choices = np.random.choice(materials, num_samples)
    labor_hours = np.random.uniform(2, 60, num_samples)
    size_sqft = np.random.uniform(0.2, 10.0, num_samples)
    is_organic = np.random.choice([True, False], num_samples, p=[0.4, 0.6])
    
    # Pricing formula (with noise)
    base_rates = {
        "Home Decor": 1200, "Jewelry": 800, "Textiles": 1500,
        "Kitchenware": 600, "Accessories": 400, "Gardening": 500
    }
    material_multipliers = {
        "Natural Vegetable Dyes": 1.25, "Multani Mitti & Quartz": 1.35,
        "Changthangi Cashmere Wool": 2.20, "Pure Chandi / Silver Alloy": 1.80,
        "Khadi Cotton": 1.10
    }
    
    prices = []
    for i in range(num_samples):
        rate = base_rates[cat_choices[i]]
        mat_mult = material_multipliers[mat_choices[i]]
        labor_cost = labor_hours[i] * 250
        size_premium = size_sqft[i] * 400
        
        predicted = (rate + labor_cost + size_premium) * mat_mult
        if is_organic[i]:
            predicted *= 1.15
            
        # Add random noise (+/- 10%)
        noise = np.random.uniform(-0.1, 0.1) * predicted
        prices.append(max(200, round(predicted + noise, -1)))
        
    df = pd.DataFrame({
        "category": cat_choices,
        "material": mat_choices,
        "labor_hours": labor_hours,
        "size_sqft": size_sqft,
        "is_organic": is_organic,
        "price": prices
    })
    return df

def train_model():
    print("Generating synthetic cost dataset...")
    df = generate_synthetic_data()
    
    X = df.drop("price", axis=1)
    y = df["price"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessor for categorical features
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['category', 'material'])
        ],
        remainder='passthrough'
    )
    
    # Random Forest Pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    print("Training RandomForest Regression model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    r2 = pipeline.score(X_test, y_test)
    print(f"Model trained successfully. Evaluation R^2 score: {r2:.4f}")
    
    # Serialize pipeline
    os.makedirs("backend/data", exist_ok=True)
    model_path = "backend/data/pricing_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(pipeline, f)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
