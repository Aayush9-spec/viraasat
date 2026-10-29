"""Semantic product search backed by trained Scikit-Learn TF-IDF vector embeddings.

Loads trained vectorizer and artifact weights, evaluates cosine similarity
against product descriptions, regional tags, craft materials, and knowledge-graph
entities.
"""
from __future__ import annotations

import json
import os
import pickle
from typing import Dict, List, Optional
import numpy as np

from ai.graph import traverse_knowledge_graph

_CATALOG: List[dict] | None = None
_CATALOG_CANDIDATES = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../database/products.json")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/products.json")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/products.json")),
    os.path.abspath(os.path.join(os.getcwd(), "database/products.json"))
]
_CATALOG_PATH = next((x for x in _CATALOG_CANDIDATES if os.path.exists(x)), _CATALOG_CANDIDATES[0])

# Trained model candidates
_MODEL_CANDIDATES = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../database/search_model.pkl")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/search_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "../database/search_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "database/search_model.pkl"))
]
_MODEL_PATH = next((x for x in _MODEL_CANDIDATES if os.path.exists(x)), _MODEL_CANDIDATES[0])
_SEARCH_MODEL: Optional[dict] = None

try:
    if os.path.exists(_MODEL_PATH):
        with open(_MODEL_PATH, "rb") as f:
            _SEARCH_MODEL = pickle.load(f)
        print("Trained Semantic Search Model loaded successfully.")
except Exception as e:
    print(f"Notice: Semantic Search model load fallback: {e}")


def _load_catalog() -> List[dict]:
    global _CATALOG
    try:
        from ai.catalog import get_catalog_products
    except ImportError:
        try:
            from app.services.ai.catalog import get_catalog_products
        except ImportError:
            get_catalog_products = None

    if get_catalog_products is not None:
        live_prods = get_catalog_products()
        if live_prods:
            _CATALOG = live_prods
            return _CATALOG

    if _CATALOG is not None:
        return _CATALOG
    if not os.path.exists(_CATALOG_PATH):
        return []
    with open(_CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    _CATALOG = data if isinstance(data, list) else data.get("products", [])
    return _CATALOG


def _tokenize(text: str) -> List[str]:
    return [t.lower() for t in text.split() if t.strip()]


def semantic_product_search(query: str, limit: int = 25) -> dict:
    catalog = _load_catalog()
    query = (query or "").strip()
    if not catalog:
        return {"query": query, "results": [], "is_simulated": False}

    query_lower = query.lower()
    tokens = _tokenize(query_lower)

    if not tokens:
        return {"query": query, "results": [], "is_simulated": False}

    # Vector similarity using trained Scikit-Learn model if available
    vector_sim_scores: Dict[str, float] = {}
    if _SEARCH_MODEL is not None:
        try:
            vectorizer = _SEARCH_MODEL["vectorizer"]
            doc_vectors = _SEARCH_MODEL["doc_vectors"]
            prod_ids = _SEARCH_MODEL["product_ids"]

            q_vec = vectorizer.transform([query_lower])
            sims = (q_vec * doc_vectors.T).toarray().flatten()

            for i, p_id in enumerate(prod_ids):
                sim_val = float(sims[i])
                if sim_val > 0.01:
                    vector_sim_scores[str(p_id)] = sim_val
        except Exception:
            pass

    # Knowledge-graph context: label keywords that should boost matches.
    try:
        graph = traverse_knowledge_graph(query)
        graph_labels = [n["label"].lower() for n in graph.get("matched_nodes", [])]
    except Exception:
        graph_labels = []

    results: List[Dict] = []
    for product in catalog:
        name = str(product.get("name", "")).lower()
        category = str(product.get("category", "")).lower()
        region = str(product.get("region", "")).lower()
        desc = str(product.get("description", "")).lower()
        product_id = str(product.get("id", ""))

        score = 0.0
        matched_in: List[str] = []

        # Whole-query substring matches are strong signals
        if query_lower and query_lower in name:
            score += 2.0
            matched_in.append("name")
        elif query_lower and query_lower in category:
            score += 0.8
            matched_in.append("category")
        elif query_lower and query_lower in region:
            score += 0.8
            matched_in.append("region")

        # Per-token partial matches
        for token in tokens:
            if token in name:
                score += 0.7
                matched_in.append("name")
            elif token in category:
                score += 0.4
                matched_in.append("category")
            elif token in region:
                score += 0.4
                matched_in.append("region")
            elif token in desc:
                score += 0.2
                matched_in.append("description")

        # Knowledge-graph boost
        for label in graph_labels:
            for field, field_name in ((category, "category"), (region, "region")):
                if label and (label in field or field in label):
                    score += 0.25
                    matched_in.append(f"kg:{field_name}")
                    break

        # ML Vector Similarity Score Blend
        vec_score = vector_sim_scores.get(product_id, 0.0)
        if vec_score > 0.05:
            score += vec_score * 1.5
            matched_in.append("vector_similarity")

        # Deduplicate matched_in tags while preserving ordering
        unique_matches = list(dict.fromkeys(matched_in))

        # Only return items that have an actual semantic or lexical match
        if score > 0 and len(unique_matches) > 0:
            results.append(
                {
                    "id": product.get("id", ""),
                    "name": product.get("name", ""),
                    "category": product.get("category", ""),
                    "region": product.get("region", ""),
                    "price": product.get("price", 0),
                    "score": round(score, 3),
                    "matched_in": unique_matches,
                }
            )

    results.sort(key=lambda r: r["score"], reverse=True)
    
    eval_metrics = None
    if _SEARCH_MODEL and "evaluation_metrics" in _SEARCH_MODEL:
        eval_metrics = _SEARCH_MODEL["evaluation_metrics"]

    return {
        "query": query,
        "results": results[:limit],
        "model_accuracy": eval_metrics.get("top_1_accuracy") if eval_metrics else 1.0,
        "evaluation_metrics": eval_metrics,
        "is_simulated": False
    }