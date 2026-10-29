import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from main import app
from app.services.storage import get_store
from app.services.ai.catalog import get_catalog_products, get_ml_config, set_ml_config, get_all_ml_configs


@pytest.fixture
def client():
    return TestClient(app)


def test_models_health_operational(client):
    """Verify that models_health finds all 7 models in the database and reports operational."""
    resp = client.get("/api/health/models")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert "models" in data
    assert len(data["models"]) == 7

    for model_name, info in data["models"].items():
        assert info["status"] == "healthy", f"Model {model_name} should be healthy, got {info}"
        assert info.get("file_size_kb", 0) > 0

    # Verify database telemetry is included
    assert "database" in data
    assert data["database"]["database_connected"] is True
    assert data["database"]["total_catalog_products"] >= 15
    assert data["database"]["ml_configs_count"] >= 10


def test_get_and_update_ml_configs(client):
    """Verify that ML configurations can be retrieved and updated in the database."""
    # 1. Fetch current configs
    resp = client.get("/api/ml/configs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    configs = data["configs"]
    assert "pricing.hourly_wage" in configs
    assert "recommendations.retrieval_weight" in configs

    orig_wage = configs["pricing.hourly_wage"]

    # 2. Update a config via PUT
    new_wage = 65.5
    put_resp = client.put("/api/ml/configs", json={"configs": {"pricing.hourly_wage": new_wage}})
    assert put_resp.status_code == 200
    put_data = put_resp.json()
    assert put_data["status"] == "updated"
    assert put_data["configs"]["pricing.hourly_wage"] == new_wage

    # 3. Verify in database store directly
    assert get_ml_config("pricing.hourly_wage") == new_wage

    # 4. Revert to original
    set_ml_config("pricing.hourly_wage", orig_wage)
    assert get_ml_config("pricing.hourly_wage") == orig_wage


def test_dynamic_catalog_connection():
    """Verify that the ML catalog connector dynamically pulls products from database."""
    products = get_catalog_products()
    assert len(products) >= 15
    first = products[0]
    assert "id" in first
    assert "name" in first
    assert "category" in first
    assert "price" in first
    assert "region" in first


def test_search_uses_database_catalog(client):
    """Verify that semantic search queries the live database catalog."""
    resp = client.get("/api/search/semantic?q=terracotta")
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) > 0
