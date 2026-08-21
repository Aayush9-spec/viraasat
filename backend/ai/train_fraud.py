import os
import pickle
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier

def generate_training_data(num_samples=400):
    clean_templates = [
        "Absolutely beautiful product, the craftsmanship is stunning.",
        "The detail on this ceramic vase is amazing. Highly recommend!",
        "Very fast delivery and the packaging kept the terracotta safe.",
        "Beautiful Pashmina wool scarf, incredibly soft and warm.",
        "Bought this as a gift, they loved the regional heritage design.",
        "Excellent quality, you can tell it was handmade with care.",
        "Perfect addition to my kitchen, rustic and elegant.",
        "Highly impressed by the wood carving quality and design.",
        "Authentic handmade item, supports real artisans. Very pleased."
    ]
    
    spam_templates = [
        "buy cheap discount click here now paypal refund review exchange",
        "click link for free discount code and cash back deals",
        "get refund if you are not happy review swap positive rating",
        "work from home and earn money click here to sign up now",
        "cheap quality broke immediately refund requested customer support",
        "spam link buy generic products at wholesale price click now",
        "fake reviews padding product rating buy reviews online"
    ]
    
    np.random.seed(42)
    
    # Generate clean reviews (label 0)
    clean_texts = np.random.choice(clean_templates, num_samples)
    clean_ratings = np.random.choice([4, 5], num_samples, p=[0.3, 0.7])
    clean_lengths = [len(t) for t in clean_texts]
    clean_labels = [0] * num_samples
    
    # Generate spam/fraud reviews (label 1)
    spam_texts = np.random.choice(spam_templates, int(num_samples * 0.3))
    spam_ratings = np.random.choice([1, 2, 5], int(num_samples * 0.3), p=[0.4, 0.4, 0.2])
    spam_lengths = [len(t) for t in spam_texts]
    spam_labels = [1] * int(num_samples * 0.3)
    
    df = pd.DataFrame({
        "review_text": np.concatenate([clean_texts, spam_texts]),
        "rating": np.concatenate([clean_ratings, spam_ratings]),
        "text_length": np.concatenate([clean_lengths, spam_lengths]),
        "label": np.concatenate([clean_labels, spam_labels])
    })
    
    # Shuffle
    return df.sample(frac=1.0, random_state=42).reset_index(drop=True)

def train_model():
    print("Generating clean and spam reviews training dataset...")
    df = generate_training_data()
    
    X = df.drop("label", axis=1)
    y = df["label"]
    
    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(max_features=25), 'review_text'),
            ('num', StandardScaler(), ['rating', 'text_length'])
        ]
    )
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])
    
    print("Training RandomForest Classifier for fraud/spam detection...")
    pipeline.fit(X, y)
    
    # Verify predictions
    clean_test = pd.DataFrame({
        "review_text": ["This is a beautiful handwoven textile, very soft."],
        "rating": [5],
        "text_length": [50]
    })
    
    spam_test = pd.DataFrame({
        "review_text": ["buy cheap discount click here paypal refund now"],
        "rating": [1],
        "text_length": [45]
    })
    
    prob_clean = pipeline.predict_proba(clean_test)[0][1]
    prob_spam = pipeline.predict_proba(spam_test)[0][1]
    
    print(f"Spam probability for clean test: {prob_clean:.4f} (expect close to 0)")
    print(f"Spam probability for spam test: {prob_spam:.4f} (expect close to 1)")
    
    # Save the pipeline
    os.makedirs("backend/data", exist_ok=True)
    model_path = "backend/data/fraud_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(pipeline, f)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
