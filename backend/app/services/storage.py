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
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from typing import Iterable, List, Tuple


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
        # Use a batched write for atomicity.
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
