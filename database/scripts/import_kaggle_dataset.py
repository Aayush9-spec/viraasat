"""Import or sync Kaggle mock handicrafts dataset into database/products.json.

Usage:
    python3 database/scripts/import_kaggle_dataset.py [--dry-run]
"""

import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_DIR = os.path.join(REPO_ROOT, "database")
KAGGLE_PATH = os.path.join(DB_DIR, "mock_kaggle_handicrafts.json")
PRODUCTS_PATH = os.path.join(DB_DIR, "products.json")

def main():
    dry_run = "--dry-run" in sys.argv

    if not os.path.exists(KAGGLE_PATH):
        print(f"Error: {KAGGLE_PATH} not found. Run generate_kaggle_mock_dataset.py first.")
        sys.exit(1)

    with open(KAGGLE_PATH, "r", encoding="utf-8") as f:
        kaggle_items = json.load(f)

    existing_products = []
    if os.path.exists(PRODUCTS_PATH):
        with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
            existing_products = json.load(f)

    existing_ids = {p.get("id") for p in existing_products if p.get("id")}
    
    new_count = 0
    updated_products = list(existing_products)

    for item in kaggle_items:
        pid = item.get("id")
        if pid not in existing_ids:
            updated_products.append({
                "id": pid,
                "name": item.get("name"),
                "category": item.get("category"),
                "region": item.get("region"),
                "price": item.get("price"),
                "description": item.get("description")
            })
            existing_ids.add(pid)
            new_count += 1

    print(f"Total products in catalog: {len(updated_products)} (Added {new_count} from Kaggle dataset)")

    if dry_run:
        print("Dry run completed. No files modified.")
    else:
        with open(PRODUCTS_PATH, "w", encoding="utf-8") as f:
            json.dump(updated_products, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved updated catalog to {PRODUCTS_PATH}")

if __name__ == "__main__":
    main()
