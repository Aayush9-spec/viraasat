import sys
import os
import time
import pickle
from datetime import datetime

base_dir = os.path.dirname(os.path.abspath(__file__))
db_dir = os.path.abspath(os.path.join(base_dir, "../database"))

models_meta = [
    ("search_model", "search_model.pkl"),
    ("pricing_model", "pricing_model.pkl"),
    ("forecasting_model", "forecasting_model.pkl"),
    ("fraud_model", "fraud_model.pkl"),
    ("market_prediction_model", "market_prediction_model.pkl"),
    ("recommendation_model", "recommendation_model.pkl"),
    ("user_identification_model", "user_identification_model.pkl"),
]

report = {}
now = time.time()
all_healthy = True

for name, fname in models_meta:
    path = os.path.join(db_dir, fname)
    exists = os.path.exists(path)
    if not exists:
        report[name] = {"status": "missing", "path": path}
        all_healthy = False
        continue

    mtime = os.path.getmtime(path)
    size_bytes = os.path.getsize(path)
    age_hours = round((now - mtime) / 3600.0, 1)

    eval_metrics = None
    trained_at = None
    try:
        with open(path, "rb") as f:
            data = pickle.load(f)
            if isinstance(data, dict):
                eval_metrics = data.get("evaluation_metrics")
                trained_at = eval_metrics.get("trained_at") if eval_metrics else None
    except Exception:
        pass

    report[name] = {
        "status": "healthy",
        "file_size_kb": round(size_bytes / 1024.0, 1),
        "age_hours": age_hours,
        "trained_at": trained_at,
        "evaluation_metrics": eval_metrics,
    }

print("Health Status:", "operational" if all_healthy else "degraded")
for k, v in report.items():
    print(f"  {k}: status={v['status']}, size={v.get('file_size_kb')}KB, age={v.get('age_hours')}h")
