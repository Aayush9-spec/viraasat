"""Seed the product catalog from a licensed CSV source.

Commercial-use policy (see database/SOURCES.md): only artisan-supplied content
or explicitly commercially-licensed sources may be merged into products.json.
Scraped marketplace dumps are rejected by this policy -- use them for internal
model experiments only, never for live listings.

Expected CSV columns (header row required):
    id, name, category, price, region, artisanId,
    description, tagline, images, stock, currency,
    features, styleTags, useCases, isActive, status

- `images`, `features`, `styleTags`, `useCases` accept pipe-separated values.
- `price` must be a number > 0 (INR). `stock` defaults to 1.
- `artisanId` must exist in database/users.json.
- Unknown `region` values are reported; merge aborts unless --allow-unknown-region.
- Existing ids in products.json are skipped (never overwritten).

For every newly added product a provenance genesis chain is minted through the
backend storage layer (ai.blockchain.get_or_create_ledger), so run with the
backend venv, e.g.::

    backend/venv/bin/python database/scripts/seed_catalog.py --input catalog.csv --dry-run
    backend/venv/bin/python database/scripts/seed_catalog.py --input catalog.csv

Exit code is 1 when any row fails validation (safe for CI gates).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "backend"))

PRODUCTS_PATH = os.path.join(REPO_ROOT, "database", "products.json")
USERS_PATH = os.path.join(REPO_ROOT, "database", "users.json")
KG_PATH = os.path.join(REPO_ROOT, "database", "knowledge_graph.json")

# Categories understood by backend/ai/train_pricing.py (warn, don't fail, otherwise).
KNOWN_CATEGORIES = {
    "Home Decor", "Jewelry", "Textiles", "Kitchenware", "Accessories", "Gardening",
}

REQUIRED = ("id", "name", "category", "price", "region", "artisanId")


def split_list(value: str) -> list[str]:
    return [part.strip() for part in (value or "").split("|") if part.strip()]


def known_regions() -> set[str]:
    regions: set[str] = set()
    try:
        with open(KG_PATH, encoding="utf-8") as f:
            for node in json.load(f).get("nodes", []):
                if node.get("type") == "State":
                    regions.add(node["label"])
    except (OSError, json.JSONDecodeError):
        pass
    return regions


def validate_row(row: dict[str, str], seen_ids: set[str], artisan_ids: set[str],
                 regions: set[str], lineno: int) -> tuple[dict | None, list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    rid = (row.get("id") or "").strip()
    for col in REQUIRED:
        if not (row.get(col) or "").strip():
            errors.append(f"line {lineno}: missing required column '{col}'")
    if rid and rid in seen_ids:
        errors.append(f"line {lineno}: duplicate id '{rid}'")
    try:
        price = float(row.get("price") or "")
        if price <= 0:
            errors.append(f"line {lineno}: price must be > 0")
    except ValueError:
        errors.append(f"line {lineno}: price is not a number")
        price = 0.0
    artisan = (row.get("artisanId") or "").strip()
    if artisan and artisan not in artisan_ids:
        errors.append(f"line {lineno}: unknown artisanId '{artisan}' (see database/users.json)")
    region = (row.get("region") or "").strip()
    if region and region not in regions:
        warnings.append(f"line {lineno}: unknown region '{region}'")
    category = (row.get("category") or "").strip()
    if category and category not in KNOWN_CATEGORIES:
        warnings.append(f"line {lineno}: category '{category}' outside pricing-model set")
    if errors:
        return None, errors + warnings

    now = datetime.now(timezone.utc).isoformat()
    try:
        stock = int(float(row.get("stock") or 1))
    except ValueError:
        stock = 1
    product = {
        "id": rid,
        "artisanId": artisan,
        "name": row["name"].strip(),
        "category": category,
        "description": (row.get("description") or "").strip(),
        "tagline": (row.get("tagline") or "").strip(),
        "price": price,
        "currency": (row.get("currency") or "INR").strip() or "INR",
        "stock": stock,
        "images": split_list(row.get("images", "")),
        "region": region,
        "isActive": (row.get("isActive") or "true").strip().lower() != "false",
        "status": (row.get("status") or "active").strip() or "active",
        "features": split_list(row.get("features", "")),
        "styleTags": split_list(row.get("styleTags", "")),
        "useCases": split_list(row.get("useCases", "")),
        "createdAt": now,
        "updatedAt": now,
    }
    return product, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="CSV file with Product rows")
    parser.add_argument("--dry-run", action="store_true", help="Validate only; write nothing")
    parser.add_argument("--allow-unknown-region", action="store_true")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL", ""),
                        help="Ledger store URL (default: backend .env / sqlite fallback)")
    args = parser.parse_args()

    with open(PRODUCTS_PATH, encoding="utf-8") as f:
        products: list = json.load(f)
    with open(USERS_PATH, encoding="utf-8") as f:
        users: list = json.load(f)
    existing_ids = {p["id"] for p in products}
    artisan_ids = {u["id"] for u in users}
    regions = known_regions()

    with open(args.input, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    new_products: list[dict] = []
    problems: list[str] = []
    for i, row in enumerate(rows, start=2):
        product, notes = validate_row(row, existing_ids | {p["id"] for p in new_products},
                                      artisan_ids, regions, i)
        for note in notes:
            print(("WARN " if product else "ERROR ") + note)
            if not product:
                problems.append(note)
        if product is None:
            continue
        if any(n.startswith(f"line {i}: unknown region") for n in notes) \
                and not args.allow_unknown_region:
            problems.append(f"line {i}: unknown region (re-run with --allow-unknown-region to accept)")
            continue
        new_products.append(product)

    print(f"rows={len(rows)} valid_new={len(new_products)} errors={len(problems)}")
    if problems:
        return 1
    if args.dry_run:
        print("dry-run: nothing written")
        return 0

    products.extend(new_products)
    with open(PRODUCTS_PATH, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Mint provenance genesis chains for the new listings only.
    if args.database_url:
        os.environ["DATABASE_URL"] = args.database_url
    from ai.blockchain import get_or_create_ledger
    for product in new_products:
        chain = get_or_create_ledger(product["id"])
        print(f"ledger {product['id']}: {len(chain)} blocks")
    print(f"merged {len(new_products)} products into database/products.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
