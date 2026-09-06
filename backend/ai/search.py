"""Semantic product search.

Scans the seeded product catalog against keyword tokens and boosts results
with knowledge-graph label matches (crafts, regions, GI tags). Falls back
gracefully to the raw product catalog when the graph is empty.
"""
from __future__ import annotations

import json
import os
from typing import Dict, List

from ai.graph import traverse_knowledge_graph

_CATALOG: List[dict] | None = None
_CATALOG_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../database/products.json")
)


def _load_catalog() -> List[dict]:
    global _CATALOG
    if _CATALOG is not None:
        return _CATALOG
    if not os.path.exists(_CATALOG_PATH):
        return []
    with open(_CATALOG_PATH, "r") as f:
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
        product_id = product.get("id", "")

        score = 0.0
        matched_in: List[str] = []

        # Whole-query substring matches are the strongest signals.
        if query_lower and query_lower in name:
            score += 1.5
            matched_in.append("name")
        elif query_lower and query_lower in category:
            score += 0.8
            matched_in.append("category")
        elif query_lower and query_lower in region:
            score += 0.8
            matched_in.append("region")

        # Per-token partial matches.
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

        # Knowledge-graph boost: if a matched craft/node label relates to the
        # product's category or region, treat it as semantically related.
        for label in graph_labels:
            for field, field_name in ((category, "category"), (region, "region")):
                if label and (label in field or field in label):
                    score += 0.25
                    matched_in.append(f"kg:{field_name}")
                    break

        if score > 0:
            results.append(
                {
                    "id": product_id,
                    "name": product.get("name", ""),
                    "category": product.get("category", ""),
                    "region": product.get("region", ""),
                    "price": product.get("price", 0),
                    "score": round(score, 3),
                    "matched_in": list(dict.fromkeys(matched_in)),
                }
            )

    results.sort(key=lambda r: r["score"], reverse=True)
    return {"query": query, "results": results[:limit], "is_simulated": False}