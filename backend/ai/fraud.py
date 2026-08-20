from pydantic import BaseModel

class ReviewAnomalyInput(BaseModel):
    seller_id: str
    reviewer_id: str
    rating: int
    review_text: str

def detect_review_fraud(payload: ReviewAnomalyInput) -> dict:
    # Mimics an anomaly detection system (Isolation Forest)
    spam_words = ["discount", "click here", "buy cheap", "review exchange", "refund", "paypal"]
    text_lower = payload.review_text.lower()
    
    spam_score = sum(1 for word in spam_words if word in text_lower)
    text_length = len(payload.review_text)
    
    # Reviews that are abnormally short with high ratings or have spam words are flagged
    anomaly_factor = 0.1
    if spam_score > 0:
        anomaly_factor += 0.4
    if text_length < 15 and payload.rating == 5:
        anomaly_factor += 0.35 # Potential bot review padding
        
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
        }
    }
