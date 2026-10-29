"""Dynamic catalog and ML configuration connector for Viraasat AI services.

Bridges the AI/ML subsystem directly to the active database (SQLite, Supabase,
or Firestore). Ensures real-time synchronization between stored products,
artisan creations, ML hyperparameters, and model inference pipelines.
"""

from __future__ import annotations

import json
import os
import sys
import time
from typing import Any, List, Optional
import urllib.request
import urllib.error

# Ensure storage module can be imported
_curr_dir = os.path.dirname(os.path.abspath(__file__))
_services_dir = os.path.abspath(os.path.join(_curr_dir, ".."))
if _services_dir not in sys.path:
    sys.path.insert(0, _services_dir)

from storage import get_store, DEFAULT_ML_CONFIGS

_LAST_SUPABASE_SYNC = 0.0
_SUPABASE_SYNC_INTERVAL = 300.0  # 5 minutes


def _try_sync_supabase():
    global _LAST_SUPABASE_SYNC
    now = time.time()
    if (now - _LAST_SUPABASE_SYNC) < _SUPABASE_SYNC_INTERVAL:
        return

    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        return

    try:
        req = urllib.request.Request(
            f"{url.rstrip('/')}/rest/v1/products?select=*",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if isinstance(data, list) and data:
                    store = get_store()
                    for p in data:
                        store.upsert_product(p)
                    _LAST_SUPABASE_SYNC = now
    except Exception as exc:
        # Soft-fail; fallback to local SQLite and JSON seeds
        pass


def get_catalog_products(category: Optional[str] = None, region: Optional[str] = None) -> List[dict]:
    """
    Retrieve live product list from the active database.
    Ensures newly added artisan items are dynamically available to ML search,
    recommendations, and forecasting.
    """
    _try_sync_supabase()
    store = get_store()
    raw_products = store.get_products(category=category, region=region)

    normalized: List[dict] = []
    seen_ids = set()

    for p in raw_products:
        pid = str(p.get("id") or "")
        name = str(p.get("name") or "").strip()
        if not name or pid in seen_ids:
            continue
        seen_ids.add(pid)

        price = float(p.get("price") or 0.0)
        cat = str(p.get("category") or "Home Decor").strip()
        reg = str(p.get("region") or "Rajasthan").strip()
        gi = bool(p.get("gi") or p.get("gi_tag") or p.get("gi_tag_certified") or False)
        mat = str(p.get("material") or "Terracotta").strip()

        normalized.append({
            "id": pid,
            "name": name,
            "category": cat,
            "region": reg,
            "price": price,
            "base_price": price,
            "gi": gi,
            "material": mat,
            "description": str(p.get("description") or ""),
            "images": p.get("images") if isinstance(p.get("images"), list) else [],
            "stock": int(p.get("stock") or 1),
        })

    return normalized


def get_ml_config(key: str, default: Any = None) -> Any:
    """Retrieve an ML configuration parameter from the database."""
    store = get_store()
    return store.get_ml_config(key, default)


def set_ml_config(key: str, value: Any) -> None:
    """Update an ML configuration parameter in the database."""
    store = get_store()
    store.set_ml_config(key, value)


def get_all_ml_configs() -> dict[str, Any]:
    """Retrieve all ML configuration parameters currently persisted in the database."""
    store = get_store()
    return store.get_all_ml_configs()


def get_database_status() -> dict[str, Any]:
    """Return database telemetry for MLOps observability."""
    store = get_store()
    prod_count = store.product_count()
    ml_configs = store.get_all_ml_configs()
    db_url = os.getenv("DATABASE_URL", "sqlite:///./viraasat.db")

    return {
        "database_connected": True,
        "database_url_scheme": db_url.split("://")[0] if "://" in db_url else "sqlite",
        "total_catalog_products": prod_count,
        "ml_configs_count": len(ml_configs),
        "ml_configs": ml_configs,
    }
