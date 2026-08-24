
import os
import pickle
import pandas as pd
from pydantic import BaseModel

class ReviewAnomalyInput(BaseModel):
    seller_id: str
    reviewer_id: str
    rating: int
    review_text: str

# Load the trained IsolationForest anomaly detection pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(current_dir, "../../database/fraud_model.pkl"))
model = None

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        print("ML Fraud Model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load ML Fraud Model: {e}")

def detect_review_fraud(payload: ReviewAnomalyInput) -> dict:
    text_length = len(payload.review_text)
    
    if model is not None:
        try:
            # Construct DataFrame for the pipeline
            input_df = pd.DataFrame([{
                "review_text": payload.review_text,
                "rating": payload.rating,
                "text_length": text_length
            }])
            
            # Predict probability of spam class (label 1)
            spam_indicator = float(model.predict_proba(input_df)[0][1])
            is_anomaly = spam_indicator > 0.60
            
            return {
                "spam_indicator_score": round(spam_indicator, 2),
                "is_fraudulent": bool(is_anomaly),
                "verdict": "Suspicious Review Pattern" if is_anomaly else "Verified Clean Review",
                "model_type": "Random Forest Classifier (Spam Threshold: 0.60)",
                "features_analyzed": {
                    "spam_probability": round(spam_indicator, 4),
                    "text_length": text_length,
                    "rating_deviation": abs(payload.rating - 4.5)
                },
                "is_simulated": False
            }
        except Exception as e:
            print(f"Fraud prediction failed, falling back. Error: {e}")
            
    # Fallback to simulated heuristics
    spam_words = ["discount", "click here", "buy cheap", "review exchange", "refund", "paypal"]
    text_lower = payload.review_text.lower()
    
    spam_score = sum(1 for word in spam_words if word in text_lower)
    
    anomaly_factor = 0.1
    if spam_score > 0:
        anomaly_factor += 0.4
    if text_length < 15 and payload.rating == 5:
        anomaly_factor += 0.35
        
    is_anomaly = anomaly_factor > 0.6
    
    return {
        "spam_indicator_score": round(anomaly_factor, 2),
        "is_fraudulent": is_anomaly,
        "verdict": "Suspicious Review Pattern" if is_anomaly else "Verified Clean Review",
        "model_type": "Isolation Forest (Anomaly Score Threshold: 0.60)",
        "features_analyzed": {
            "spam_keywords_detected": spam_score,
            "text_length": text_length,
            "rating_deviation": abs(payload.rating - 4.5)
        },
        "is_simulated": True
    }

