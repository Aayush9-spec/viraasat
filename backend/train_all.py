"""Master training script for Viraasat AI platform.

Executes all 7 model training pipelines sequentially:
  1. Search model (TF-IDF vectorizer + domain synonyms)
  2. Pricing model (RandomForestRegressor)
  3. Forecasting model (Ridge time-series pipeline)
  4. Fraud model (RandomForestClassifier review spam detector)
  5. Market prediction model (LSTM + GBT ensemble)
  6. Recommendation model (Two-Tower NN + GBT ranker + co-purchase matrix)
  7. User identification model (GBT classifier + K-Means clustering)

Outputs both timestamped archive artifacts and active latest .pkl files.
"""

import os
import shutil
import sys
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if os.path.join(BACKEND_DIR, "app/services") not in sys.path:
    sys.path.insert(0, os.path.join(BACKEND_DIR, "app/services"))

DATABASE_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "../database"))
ARCHIVE_DIR = os.path.join(DATABASE_DIR, "archive")

MODELS = [
    ("Search Model", "ai.train_search", "search_model.pkl"),
    ("Pricing Model", "ai.train_pricing", "pricing_model.pkl"),
    ("Forecasting Model", "ai.train_forecasting", "forecasting_model.pkl"),
    ("Fraud Model", "ai.train_fraud", "fraud_model.pkl"),
    ("Market Prediction Model", "ai.train_market_prediction", "market_prediction_model.pkl"),
    ("Recommendation Model", "ai.train_recommendations", "recommendation_model.pkl"),
    ("User Identification Model", "ai.train_user_identification", "train_model"),
]


def run_all():
    print("=" * 68)
    print("Viraasat AI Platform - Master Training Pipeline")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("=" * 68)

    os.makedirs(DATABASE_DIR, exist_ok=True)
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    success_count = 0
    failed_models = []

    for name, mod_path, pkl_name in MODELS:
        print(f"\n[Running] {name} ({mod_path}) ...")
        try:
            # Import and run train function
            if mod_path == "ai.train_user_identification":
                import ai.train_user_identification as m
                m.train_model()
            elif mod_path == "ai.train_search":
                import ai.train_search as m
                m.train_and_evaluate_search_model()
            else:
                import importlib
                m = importlib.import_module(mod_path)
                if hasattr(m, "train_model"):
                    m.train_model()
                else:
                    raise AttributeError(f"Module {mod_path} has no train_model()")

            # Archive snapshot copy
            src_path = os.path.join(DATABASE_DIR, pkl_name)
            if os.path.exists(src_path):
                base, ext = os.path.splitext(pkl_name)
                archive_name = f"{base}_{timestamp}{ext}"
                archive_path = os.path.join(ARCHIVE_DIR, archive_name)
                shutil.copy2(src_path, archive_path)
                print(f"  -> Archived snapshot: {archive_name}")

            print(f"  [SUCCESS] {name}")
            success_count += 1
        except Exception as exc:
            print(f"  [FAILED] {name}: {exc}")
            import traceback
            traceback.print_exc()
            failed_models.append((name, str(exc)))

    print("\n" + "=" * 68)
    print("Training Pipeline Complete")
    print(f"  Successful: {success_count}/{len(MODELS)}")
    print(f"  Failed    : {len(failed_models)}")
    if failed_models:
        print("  Failures:")
        for name, err in failed_models:
            print(f"    - {name}: {err}")
    print("=" * 68)

    if failed_models:
        sys.exit(1)


if __name__ == "__main__":
    run_all()
