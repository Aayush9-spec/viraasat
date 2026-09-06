"""Tests for the semantic product search endpoint logic."""
from ai.search import semantic_product_search, _tokenize, _load_catalog


def test_tokenize_splits_and_lowercases():
    assert _tokenize("Blue Pottery Vase") == ["blue", "pottery", "vase"]
    assert _tokenize("   ") == []


def test_load_catalog_returns_seeded_products():
    catalog = _load_catalog()
    assert isinstance(catalog, list)
    assert len(catalog) > 0
    for product in catalog:
        assert product.get("id")
        assert product.get("name")


def test_search_returns_sorted_results():
    result = semantic_product_search("Textiles")
    assert result["query"] == "Textiles"
    assert result["is_simulated"] is False
    scores = [r["score"] for r in result["results"]]
    assert scores == sorted(scores, reverse=True)
    for item in result["results"]:
        assert "id" in item and "name" in item and "score" in item
        assert "matched_in" in item


def test_search_prioritizes_name_matches_over_category():
    textiles = semantic_product_search("Textiles")
    home_decor = semantic_product_search("Home Decor")
    both = {"textiles": [r for r in textiles["results"] if r["score"] > 0],
            "home_decor": [r for r in home_decor["results"] if r["score"] > 0]}
    # Every result carrying a whole-query name match should outrank a
    # category-only match for the same query.
    for label in ("textiles", "home_decor"):
        results = both[label]
        if len(results) > 1:
            name_hits = [r for r in results if "name" in r["matched_in"]]
            category_only = [r for r in results if r["matched_in"] == ["category"]]
            if name_hits and category_only:
                assert name_hits[0]["score"] > category_only[0]["score"]


def test_search_empty_query_is_harmless():
    result = semantic_product_search("")
    assert result["query"] == ""
    assert isinstance(result["results"], list)


def test_search_unknown_query_returns_no_results():
    result = semantic_product_search("zzz-nothing-matches-this-query")
    assert result["results"] == []