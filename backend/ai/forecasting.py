import random

def calculate_demand_forecast(region: str, category: str) -> dict:
    # Simulates an LSTM/Prophet model capturing seasonal trends, festival spikes, and tourism records
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Establish base demand patterns (scale of 0 to 100)
    base_demand = [45, 50, 48, 40, 35, 30, 38, 55, 62, 85, 95, 80] # Peak in Oct/Nov (Festivals), Low in May/Jun (Summer heat)
    
    # Region multipliers
    region_multiplier = {
        "Rajasthan": 1.2,
        "Kashmir": 1.3,
        "Kutch": 1.1,
        "Bihar": 0.95
    }
    mult = region_multiplier.get(region, 1.0)
    
    # Apply factor matching specific categories (e.g., textiles spike in winter)
    category_modifier = [1.0] * 12
    if category == "Textiles" or region == "Kashmir":
        # Textiles & Kashmir woolens peak heavily in winter months
        category_modifier = [1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.7, 1.0, 1.1, 1.3, 1.5, 1.6]
        
    forecast = []
    for i, month in enumerate(months):
        raw_val = base_demand[i] * mult * category_modifier[i]
        # Add slight natural deviation (predictive uncertainty)
        deviation = random.uniform(-3, 3)
        forecast.append({
            "month": month,
            "demand_index": round(max(10, raw_val + deviation), 1),
            "tourist_inflow_k": round(150 * mult * (1.5 if i in [9, 10, 11, 0] else 0.6)) # tourist high in winter
        })
        
    # Anomaly warnings (like supply chain shortage warnings)
    warnings = []
    if category == "Textiles" and region == "Kashmir":
        warnings.append("High winter demand ahead: Source Pashmina wool raw materials by August to avoid pricing spikes.")
    elif category == "Home Decor" and region == "Rajasthan":
        warnings.append("Diwali festival spikes demand: Recommended to double production batches for Blue Pottery vases.")
        
    return {
        "region": region,
        "category": category,
        "time_series": forecast,
        "model_accuracy": 0.924, # MAPE 7.6%
        "warnings": warnings
    }
