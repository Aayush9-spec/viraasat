"""
Seed Supabase DB with products and users from the local JSON files.

Usage:
    python3 database/scripts/seed_supabase.py

Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
frontend/.env.local automatically, so no extra setup is needed.

Supabase schema (discovered via column probing):
  users:    id(uuid), email, role, display_name, avatar_url, bio, created_at
  products: id(uuid), name, category, region, price, description,
            artisan_id(uuid FK→users.id), images(jsonb), stock, created_at
"""

from __future__ import annotations

import json
import os
import re
import sys
import uuid
import urllib.request
import urllib.error

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_FILE  = os.path.join(REPO_ROOT, "frontend", ".env.local")

# ── load env vars ──────────────────────────────────────────────────────────

def load_env(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r'^([A-Z0-9_]+)=(.*)$', line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except OSError:
        pass
    return env

env = load_env(ENV_FILE)
SUPABASE_URL      = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    sys.exit("❌  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not found in frontend/.env.local")

# ── REST helper ────────────────────────────────────────────────────────────

def rest(method: str, table: str, payload: list | None = None,
         params: str = "") -> tuple[int, object]:
    url = f"{SUPABASE_URL}/rest/v1/{table}{params}"
    headers = {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal,resolution=ignore-duplicates",
    }
    data = json.dumps(payload).encode() if payload is not None else None
    req  = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read()
            return r.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, json.loads(body) if body else {}

def upsert(table: str, rows: list[dict], label: str) -> bool:
    if not rows:
        print(f"  ⏭  {label}: nothing to insert")
        return True
    status, body = rest("POST", table, rows)
    if status in (200, 201, 204):
        print(f"  ✅  {label}: {len(rows)} rows  (HTTP {status})")
        return True
    else:
        print(f"  ❌  {label}: HTTP {status} — {body}")
        return False

# ── stable UUID mapping (deterministic, so re-runs are idempotent) ─────────
# We use uuid5(DNS namespace, local-id-string) so the same local ID always
# maps to the same UUID.

NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # uuid.NAMESPACE_DNS

def to_uuid(local_id: str) -> str:
    return str(uuid.uuid5(NS, local_id))

# ── load local JSON ────────────────────────────────────────────────────────

with open(os.path.join(REPO_ROOT, "database", "products.json")) as f:
    raw_products: list[dict] = json.load(f)

with open(os.path.join(REPO_ROOT, "database", "users.json")) as f:
    raw_users: list[dict] = json.load(f)

# ── build user rows ────────────────────────────────────────────────────────
# users schema: id(uuid), email, role, display_name, avatar_url, bio, created_at

user_rows: list[dict] = []
for u in raw_users:
    user_rows.append({
        "id":           to_uuid(u["id"]),
        "email":        u["email"],
        "role":         u.get("role", "artisan"),
        "display_name": u["name"],
        "bio":          u.get("profile", {}).get("bio", ""),
    })

# ── build product rows ─────────────────────────────────────────────────────
# products schema: id(uuid), name, category, region, price, description,
#                  artisan_id(uuid FK), images(array), stock, created_at

CATEGORY_IMAGES: dict[str, str] = {
    "Home Decor":   "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    "Textiles":     "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600",
    "Kitchenware":  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
    "Jewelry":      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
    "Accessories":  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600",
    "Gardening":    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600",
    "Painting":     "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600",
}
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=600"

artisan_uuids = [to_uuid(u["id"]) for u in raw_users]

product_rows: list[dict] = []
for i, p in enumerate(raw_products):
    product_rows.append({
        "id":          to_uuid(p["id"]),
        "name":        p["name"],
        "category":    p["category"],
        "region":      p["region"],
        "price":       p["price"],
        "description": p.get("description", ""),
        "artisan_id":  artisan_uuids[i % len(artisan_uuids)],
        "images":      [CATEGORY_IMAGES.get(p["category"], DEFAULT_IMAGE)],
        "stock":       10,
    })

# ── seed ───────────────────────────────────────────────────────────────────
print(f"\n🌱  Seeding Supabase at {SUPABASE_URL}\n")

ok_users = upsert("users",    user_rows,    f"users ({len(user_rows)})")
if ok_users:
    upsert("products", product_rows, f"products ({len(product_rows)})")

print("\nDone.")
