"""Storage layer for Viraasat backend.

Picks a backend based on `DATABASE_URL`:
  - `sqlite:///./viraasat.db`  (default; file-based, persists across restarts)
  - `firestore://PROJECT_ID`   (uses firebase-admin; configure with
                               FIREBASE_SERVICE_ACCOUNT_JSON env var)
  - `memory://`                (legacy per-process JSON behaviour; for tests)

Every storage backend exposes the same surface:
  - get_ledger(product_id) -> list[dict]
  - append_ledger_block(product_id, block) -> None
  - get_knowledge_graph() -> (nodes: list, edges: list)
  - get_ml_config(key, default) -> Any
  - set_ml_config(key, value) -> None
  - get_all_ml_configs() -> dict
  - get_products(category, region) -> list[dict]
  - upsert_product(product) -> None
  - product_count() -> int
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Iterable, List, Optional, Tuple

DEFAULT_ML_CONFIGS: dict[str, Any] = {
    "pricing.hourly_wage": 55.0,
    "pricing.base_overhead": 35.0,
    "pricing.size_rate": 20.0,
    "pricing.labor_multiplier": 1.15,
    "forecasting.tourist_baseline": 10.0,
    "forecasting.peak_season_boost": 1.25,
    "market.discount_elasticity": 1.08,
    "market.gi_boost": 1.12,
    "market.confidence_threshold": 0.70,
    "recommendations.retrieval_weight": 0.30,
    "recommendations.ranker_weight": 0.70,
    "recommendations.default_top_k": 10,
    "fraud.anomaly_threshold": -0.05,
    "fraud.min_text_length": 15,
    "user_segmentation.champion_spend": 25000.0,
    "user_segmentation.loyal_spend": 10000.0,
    "user_segmentation.promising_spend": 3000.0,
}


# ---------------------------------------------------------------------------
# SQLite backend (default)
# ---------------------------------------------------------------------------

DEFAULT_SQLITE_PATH = os.getenv("SQLITE_PATH", "viraasat.db")


def _sqlite_connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


_sqlite_lock = threading.Lock()


class SQLiteStore:
    def __init__(self, path: str = DEFAULT_SQLITE_PATH) -> None:
        self.path = path
        self._conn = _sqlite_connect(path)
        self._init_schema()
        self._seed_initial_data()

    @contextmanager
    def _cur(self):
        with _sqlite_lock:
            cur = self._conn.cursor()
            try:
                yield cur
            finally:
                cur.close()

    def _init_schema(self) -> None:
        with self._cur() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS ledger_blocks (
                    product_id TEXT NOT NULL,
                    idx INTEGER NOT NULL,
                    payload TEXT NOT NULL,
                    PRIMARY KEY (product_id, idx)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS knowledge_nodes (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL,
                    type TEXT,
                    data TEXT
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS knowledge_edges (
                    source TEXT NOT NULL,
                    target TEXT NOT NULL,
                    relation TEXT,
                    PRIMARY KEY (source, target, relation)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS ml_configs (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT,
                    region TEXT,
                    price REAL,
                    description TEXT,
                    artisan_id TEXT,
                    images TEXT,
                    stock INTEGER DEFAULT 1,
                    gi_tag INTEGER DEFAULT 0,
                    material TEXT,
                    raw_json TEXT,
                    updated_at TEXT NOT NULL
                )
                """
            )

    def _load_seed_products(self) -> list[dict]:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.abspath(os.path.join(base_dir, "../../../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../../../../database/products.json")),
            os.path.abspath(os.path.join(os.getcwd(), "database/products.json")),
            os.path.abspath(os.path.join(os.getcwd(), "../database/products.json")),
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    with open(c, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            return data
                        if isinstance(data, dict) and "products" in data:
                            return data["products"]
                except Exception:
                    pass
        return []

    def _seed_initial_data(self) -> None:
        now_str = datetime.utcnow().isoformat() + "Z"
        with self._cur() as cur:
            # 1. Seed ML configs if missing
            row = cur.execute("SELECT COUNT(*) FROM ml_configs").fetchone()
            if not row or row[0] == 0:
                cur.executemany(
                    "INSERT OR REPLACE INTO ml_configs (key, value, updated_at) VALUES (?, ?, ?)",
                    [(k, json.dumps(v), now_str) for k, v in DEFAULT_ML_CONFIGS.items()],
                )

            # 2. Seed products if missing
            prod_row = cur.execute("SELECT COUNT(*) FROM products").fetchone()
            if not prod_row or prod_row[0] == 0:
                prods = self._load_seed_products()
                for p in prods:
                    pid = str(p.get("id") or "")
                    name = str(p.get("name") or "")
                    if not pid or not name:
                        continue
                    cat = p.get("category", "")
                    reg = p.get("region", "")
                    price = float(p.get("price", 0.0))
                    desc = p.get("description", "")
                    artisan = p.get("artisanId") or p.get("artisan_id", "")
                    imgs = json.dumps(p.get("images", []))
                    stock = int(p.get("stock", 1))
                    gi = 1 if p.get("gi") or p.get("gi_tag") or p.get("gi_tag_certified") else 0
                    mat = p.get("material", "")
                    cur.execute(
                        """
                        INSERT OR REPLACE INTO products
                        (id, name, category, region, price, description, artisan_id, images, stock, gi_tag, material, raw_json, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (pid, name, cat, reg, price, desc, artisan, imgs, stock, gi, mat, json.dumps(p), now_str),
                    )

    # --- ML configs ---

    def get_ml_config(self, key: str, default: Any = None) -> Any:
        with self._cur() as cur:
            row = cur.execute("SELECT value FROM ml_configs WHERE key = ?", (key,)).fetchone()
            if row:
                try:
                    return json.loads(row[0])
                except Exception:
                    return row[0]
        return DEFAULT_ML_CONFIGS.get(key, default)

    def set_ml_config(self, key: str, value: Any) -> None:
        now_str = datetime.utcnow().isoformat() + "Z"
        with self._cur() as cur:
            cur.execute(
                "INSERT OR REPLACE INTO ml_configs (key, value, updated_at) VALUES (?, ?, ?)",
                (key, json.dumps(value), now_str),
            )

    def get_all_ml_configs(self) -> dict[str, Any]:
        configs = dict(DEFAULT_ML_CONFIGS)
        with self._cur() as cur:
            rows = cur.execute("SELECT key, value FROM ml_configs").fetchall()
            for k, v in rows:
                try:
                    configs[k] = json.loads(v)
                except Exception:
                    configs[k] = v
        return configs

    # --- products catalog ---

    def get_products(self, category: Optional[str] = None, region: Optional[str] = None) -> List[dict]:
        with self._cur() as cur:
            query = "SELECT raw_json FROM products WHERE 1=1"
            params = []
            if category:
                query += " AND LOWER(category) = LOWER(?)"
                params.append(category)
            if region:
                query += " AND LOWER(region) = LOWER(?)"
                params.append(region)
            rows = cur.execute(query, params).fetchall()
            if rows:
                return [json.loads(r[0]) for r in rows]
        return self._load_seed_products()

    def upsert_product(self, product: dict) -> None:
        now_str = datetime.utcnow().isoformat() + "Z"
        pid = str(product.get("id") or "")
        name = str(product.get("name") or "")
        if not pid or not name:
            return
        cat = product.get("category", "")
        reg = product.get("region", "")
        price = float(product.get("price", 0.0))
        desc = product.get("description", "")
        artisan = product.get("artisanId") or product.get("artisan_id", "")
        imgs = json.dumps(product.get("images", []))
        stock = int(product.get("stock", 1))
        gi = 1 if product.get("gi") or product.get("gi_tag") or product.get("gi_tag_certified") else 0
        mat = product.get("material", "")
        with self._cur() as cur:
            cur.execute(
                """
                INSERT OR REPLACE INTO products
                (id, name, category, region, price, description, artisan_id, images, stock, gi_tag, material, raw_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (pid, name, cat, reg, price, desc, artisan, imgs, stock, gi, mat, json.dumps(product), now_str),
            )

    def product_count(self) -> int:
        with self._cur() as cur:
            row = cur.execute("SELECT COUNT(*) FROM products").fetchone()
        return int(row[0]) if row else 0

    # --- ledger ---

    def get_ledger(self, product_id: str) -> List[dict]:
        with self._cur() as cur:
            rows = cur.execute(
                "SELECT idx, payload FROM ledger_blocks "
                "WHERE product_id = ? ORDER BY idx ASC",
                (product_id,),
            ).fetchall()
        return [json.loads(r[1]) | {"index": r[0]} for r in rows]

    def append_ledger_block(self, product_id: str, block: dict) -> None:
        # Strip the index from the payload; we store it as the column.
        payload = {k: v for k, v in block.items() if k != "index"}
        with self._cur() as cur:
            cur.execute(
                "INSERT OR REPLACE INTO ledger_blocks (product_id, idx, payload) "
                "VALUES (?, ?, ?)",
                (product_id, block["index"], json.dumps(payload)),
            )

    def ledger_count(self, product_id: str) -> int:
        with self._cur() as cur:
            row = cur.execute(
                "SELECT COUNT(*) FROM ledger_blocks WHERE product_id = ?",
                (product_id,),
            ).fetchone()
        return int(row[0]) if row else 0

    # --- knowledge graph ---

    def get_knowledge_graph(self) -> Tuple[List[dict], List[dict]]:
        with self._cur() as cur:
            nodes = [
                {"id": r[0], "label": r[1], "type": r[2]}
                for r in cur.execute(
                    "SELECT id, label, type FROM knowledge_nodes"
                ).fetchall()
            ]
            edges = [
                {"source": r[0], "target": r[1], "relation": r[2]}
                for r in cur.execute(
                    "SELECT source, target, relation FROM knowledge_edges"
                ).fetchall()
            ]
        return nodes, edges

    def replace_knowledge_graph(
        self, nodes: Iterable[dict], edges: Iterable[dict]
    ) -> None:
        with self._cur() as cur:
            cur.execute("DELETE FROM knowledge_nodes")
            cur.execute("DELETE FROM knowledge_edges")
            cur.executemany(
                "INSERT INTO knowledge_nodes (id, label, type, data) VALUES (?, ?, ?, ?)",
                [
                    (n["id"], n["label"], n.get("type"), json.dumps(n))
                    for n in nodes
                ],
            )
            cur.executemany(
                "INSERT INTO knowledge_edges (source, target, relation) VALUES (?, ?, ?)",
                [
                    (e["source"], e["target"], e.get("relation"))
                    for e in edges
                ],
            )


# ---------------------------------------------------------------------------
# In-memory backend (tests / fallback)
# ---------------------------------------------------------------------------


class MemoryStore:
    def __init__(self) -> None:
        self._ledgers: dict[str, list[dict]] = {}
        self._kg_nodes: list[dict] = []
        self._kg_edges: list[dict] = []
        self._ml_configs: dict[str, Any] = dict(DEFAULT_ML_CONFIGS)
        self._products: dict[str, dict] = {}
        self._seed_initial_data()

    def _seed_initial_data(self) -> None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.abspath(os.path.join(base_dir, "../../../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../../database/products.json")),
            os.path.abspath(os.path.join(base_dir, "../../../../database/products.json")),
            os.path.abspath(os.path.join(os.getcwd(), "database/products.json")),
            os.path.abspath(os.path.join(os.getcwd(), "../database/products.json")),
        ]
        for c_path in candidates:
            if os.path.exists(c_path):
                try:
                    with open(c_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        prods = data if isinstance(data, list) else data.get("products", [])
                        for p in prods:
                            pid = str(p.get("id") or "")
                            if pid:
                                self._products[pid] = dict(p)
                    if self._products:
                        break
                except Exception:
                    pass

    def get_ml_config(self, key: str, default: Any = None) -> Any:
        return self._ml_configs.get(key, default)

    def set_ml_config(self, key: str, value: Any) -> None:
        self._ml_configs[key] = value

    def get_all_ml_configs(self) -> dict[str, Any]:
        return dict(self._ml_configs)

    def get_products(self, category: Optional[str] = None, region: Optional[str] = None) -> List[dict]:
        prods = list(self._products.values())
        if category:
            prods = [p for p in prods if (p.get("category") or "").lower() == category.lower()]
        if region:
            prods = [p for p in prods if (p.get("region") or "").lower() == region.lower()]
        return prods

    def upsert_product(self, product: dict) -> None:
        pid = str(product.get("id") or "")
        if pid:
            self._products[pid] = dict(product)

    def product_count(self) -> int:
        return len(self._products)

    def get_ledger(self, product_id: str) -> List[dict]:
        return list(self._ledgers.get(product_id, []))

    def append_ledger_block(self, product_id: str, block: dict) -> None:
        self._ledgers.setdefault(product_id, []).append(block)

    def ledger_count(self, product_id: str) -> int:
        return len(self._ledgers.get(product_id, []))

    def get_knowledge_graph(self) -> Tuple[List[dict], List[dict]]:
        return list(self._kg_nodes), list(self._kg_edges)

    def replace_knowledge_graph(
        self, nodes: Iterable[dict], edges: Iterable[dict]
    ) -> None:
        self._kg_nodes = list(nodes)
        self._kg_edges = list(edges)


# ---------------------------------------------------------------------------
# Firestore backend (stub; requires firebase-admin at runtime)
# ---------------------------------------------------------------------------


class FirestoreStore:  # pragma: no cover - exercised in production only
    def __init__(self, project_id: str) -> None:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if cred_json:
                import base64

                decoded = base64.b64decode(cred_json).decode()
                cred = credentials.Certificate(json.loads(decoded))
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
        self._db = firestore.client()

    def get_ml_config(self, key: str, default: Any = None) -> Any:
        try:
            doc = self._db.collection("ml_configs").document(key).get()
            if doc.exists:
                return doc.to_dict().get("value", default)
        except Exception:
            pass
        return DEFAULT_ML_CONFIGS.get(key, default)

    def set_ml_config(self, key: str, value: Any) -> None:
        self._db.collection("ml_configs").document(key).set({"value": value, "updated_at": datetime.utcnow().isoformat() + "Z"})

    def get_all_ml_configs(self) -> dict[str, Any]:
        configs = dict(DEFAULT_ML_CONFIGS)
        try:
            for d in self._db.collection("ml_configs").stream():
                configs[d.id] = d.to_dict().get("value")
        except Exception:
            pass
        return configs

    def get_products(self, category: Optional[str] = None, region: Optional[str] = None) -> List[dict]:
        try:
            query = self._db.collection("products")
            if category:
                query = query.where("category", "==", category)
            if region:
                query = query.where("region", "==", region)
            return [d.to_dict() for d in query.stream()]
        except Exception:
            return []

    def upsert_product(self, product: dict) -> None:
        pid = str(product.get("id") or "")
        if pid:
            self._db.collection("products").document(pid).set(product)

    def product_count(self) -> int:
        try:
            return len(list(self._db.collection("products").stream()))
        except Exception:
            return 0

    def _ledger_col(self, product_id: str):
        return self._db.collection("provenance").document(product_id).collection("blocks")

    def get_ledger(self, product_id: str) -> List[dict]:
        docs = self._ledger_col(product_id).order_by("index").stream()
        return [d.to_dict() for d in docs]

    def append_ledger_block(self, product_id: str, block: dict) -> None:
        self._ledger_col(product_id).document(str(block["index"])).set(block)

    def ledger_count(self, product_id: str) -> int:
        return len(list(self._ledger_col(product_id).stream()))

    def get_knowledge_graph(self):
        nodes = [
            d.to_dict() for d in self._db.collection("knowledge_nodes").stream()
        ]
        edges = [
            d.to_dict() for d in self._db.collection("knowledge_edges").stream()
        ]
        return nodes, edges

    def replace_knowledge_graph(self, nodes, edges) -> None:
        batch = self._db.batch()
        for n in nodes:
            batch.set(self._db.collection("knowledge_nodes").document(n["id"]), n)
        for e in edges:
            doc_id = f"{e['source']}__{e.get('relation','' )}__{e['target']}"
            batch.set(self._db.collection("knowledge_edges").document(doc_id), e)
        batch.commit()


# ---------------------------------------------------------------------------
# Selector
# ---------------------------------------------------------------------------


_store_singleton = None


def get_store():
    global _store_singleton
    if _store_singleton is not None:
        return _store_singleton

    url = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")
    if url.startswith("sqlite:///"):
        path = url[len("sqlite:///"):] or DEFAULT_SQLITE_PATH
        _store_singleton = SQLiteStore(path)
    elif url.startswith("memory://"):
        _store_singleton = MemoryStore()
    elif url.startswith("firestore://"):
        _store_singleton = FirestoreStore(url[len("firestore://"):])
    else:
        raise ValueError(f"Unsupported DATABASE_URL scheme: {url}")

    return _store_singleton
