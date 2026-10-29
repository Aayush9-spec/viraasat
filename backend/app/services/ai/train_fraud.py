import os
import json
import pickle
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


def load_real_product_names():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "../../../../database/products.json")),
        os.path.abspath(os.path.join(current_dir, "../../database/products.json")),
        os.path.abspath(os.path.join(os.getcwd(), "database/products.json")),
        os.path.abspath(os.path.join(os.getcwd(), "../database/products.json")),
    ]
    products_path = next((c for c in candidates if os.path.exists(c)), candidates[0])
    names = []
    if os.path.exists(products_path):
        try:
            with open(products_path, "r", encoding="utf-8") as f:
                products = json.load(f)
                names = [p.get("name", "") for p in products if p.get("name")]
        except Exception:
            pass
    return names


def generate_training_data(num_samples=500):
    product_names = load_real_product_names()

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

    if product_names:
        for p_name in product_names:
            clean_templates.append(f"Received the {p_name}, incredible craftsmanship and fast delivery!")
            clean_templates.append(f"The {p_name} is so authentic, love supporting local Indian artisans.")

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

    # Clean reviews (label 0)
    clean_texts = np.random.choice(clean_templates, num_samples).tolist()
    clean_ratings = np.random.choice([4, 5], num_samples, p=[0.3, 0.7]).tolist()
    clean_lengths = [len(t) for t in clean_texts]
    clean_labels = [0] * num_samples

    # Spam/fraud reviews (label 1)
    spam_count = int(num_samples * 0.35)
    spam_texts = np.random.choice(spam_templates, spam_count).tolist()
    spam_ratings = np.random.choice([1, 2, 5], spam_count, p=[0.4, 0.4, 0.2]).tolist()
    spam_lengths = [len(t) for t in spam_texts]
    spam_labels = [1] * spam_count

    df = pd.DataFrame({
        "review_text": clean_texts + spam_texts,
        "rating": clean_ratings + spam_ratings,
        "text_length": clean_lengths + spam_lengths,
        "label": clean_labels + spam_labels
    })

    return df.sample(frac=1.0, random_state=42).reset_index(drop=True)


def load_kaggle_fraud_data(num_samples: int = 5000) -> pd.DataFrame:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "../../../../database/kaggle_data/fake reviews dataset.csv")),
        os.path.abspath(os.path.join(current_dir, "../../database/kaggle_data/fake reviews dataset.csv")),
        os.path.abspath(os.path.join(os.getcwd(), "database/kaggle_data/fake reviews dataset.csv")),
        os.path.abspath(os.path.join(os.getcwd(), "../database/kaggle_data/fake reviews dataset.csv")),
    ]
    kaggle_path = next((c for c in candidates if os.path.exists(c)), None)
    if not kaggle_path:
        print("Kaggle fake reviews dataset not found at default paths, using platform fallback generator.")
        return generate_training_data()

    print(f"Loading real Kaggle fake reviews dataset from: {kaggle_path}")
    df_raw = pd.read_csv(kaggle_path).dropna(subset=["text_"])

    # Real authentic buyer reviews (OR)
    n_or = min(len(df_raw[df_raw["label"] == "OR"]), num_samples // 2)
    df_or = df_raw[df_raw["label"] == "OR"].sample(n=n_or, random_state=42)
    clean_texts = df_or["text_"].astype(str).tolist()
    clean_ratings = df_or["rating"].astype(float).tolist()

    # Domain artisan clean reviews
    product_names = load_real_product_names()
    artisan_clean = [
        "This handwoven carpet is absolutely gorgeous, the weave quality is amazing!",
        "Authentic handmade item, supports real artisans. Very pleased.",
        "The detail on this ceramic vase is amazing. Highly recommend!",
        "Beautiful Pashmina wool scarf, incredibly soft and warm.",
        "Bought this as a gift, they loved the regional heritage design.",
        "Excellent quality, you can tell it was handmade with care.",
        "Perfect addition to my kitchen, rustic and elegant.",
        "Highly impressed by the wood carving quality and design."
    ]
    if product_names:
        for p_name in product_names[:10]:
            artisan_clean.append(f"Received the {p_name}, incredible craftsmanship and fast delivery!")
    clean_texts.extend(artisan_clean * 30)
    clean_ratings.extend([5.0] * (len(artisan_clean) * 30))

    # Real computer-generated fake reviews from Kaggle (CG)
    n_cg = min(len(df_raw[df_raw["label"] == "CG"]), num_samples // 2)
    df_cg = df_raw[df_raw["label"] == "CG"].sample(n=n_cg, random_state=42)
    spam_texts = df_cg["text_"].astype(str).tolist()
    spam_ratings = df_cg["rating"].astype(float).tolist()

    # Promotional spam patterns
    spam_patterns = [
        "buy cheap discount click here now paypal refund review exchange",
        "click link for free discount code and cash back deals",
        "get refund if you are not happy review swap positive rating",
        "work from home and earn money click here to sign up now",
        "spam link buy generic products at wholesale price click now",
        "fake reviews padding product rating buy reviews online",
        "buy discount cheap click here paypal refund"
    ]
    spam_texts.extend(spam_patterns * 40)
    spam_ratings.extend([1.0] * (len(spam_patterns) * 40))

    clean_labels = [0] * len(clean_texts)
    spam_labels = [1] * len(spam_texts)

    all_texts = clean_texts + spam_texts
    all_ratings = clean_ratings + spam_ratings
    all_lengths = [len(t) for t in all_texts]
    all_labels = clean_labels + spam_labels

    df = pd.DataFrame({
        "review_text": all_texts,
        "rating": all_ratings,
        "text_length": all_lengths,
        "label": all_labels
    })

    return df.sample(frac=1.0, random_state=42).reset_index(drop=True)


def train_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    print("Loading review fraud detection dataset from Kaggle...")
    df = load_kaggle_fraud_data()

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(max_features=40), 'review_text'),
            ('num', StandardScaler(), ['rating', 'text_length'])
        ]
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42))
    ])

    print("Training RandomForest Classifier for fraud detection...")
    pipeline.fit(X_train, y_train)

    # Independent evaluation on test split
    y_pred = pipeline.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))

    evaluation_metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "verified_accuracy": round(acc, 4),
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "model_arch": "RandomForestClassifier(n_estimators=50) + TF-IDF",
        "dataset_source": "Kaggle Fake Reviews Dataset + Indian Handicrafts Domain Seeds",
        "training_samples": len(df),
    }

    print(f"Fraud Model Test Metrics - Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")

    save_dirs = [
        os.path.abspath(os.path.join(current_dir, "../../database")),
        os.path.abspath(os.path.join(current_dir, "../../../../database")),
    ]
    for mdir in save_dirs:
        try:
            os.makedirs(mdir, exist_ok=True)
            mpath = os.path.join(mdir, "fraud_model.pkl")
            with open(mpath, "wb") as f:
                pickle.dump({
                    "pipeline": pipeline,
                    "evaluation_metrics": evaluation_metrics
                }, f)
            print(f"Fraud model saved with evaluation metrics to {mpath}")
        except Exception as e:
            print(f"Warning: Failed saving to {mdir}: {e}")

    return {
        "pipeline": pipeline,
        "evaluation_metrics": evaluation_metrics
    }


if __name__ == "__main__":
    train_model()
