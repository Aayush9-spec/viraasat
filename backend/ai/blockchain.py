"""Provenance ledger.

Chains of blocks are stored in the configured persistence layer
(see app.services.storage). State survives process restarts and is
shared across multiple workers (when using a networked backend).
"""
import hashlib
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

DIFFICULTY = 3  # Proof-of-work target prefix length


def calculate_block_hash(
    index: int, timestamp: str, action: str, actor: str, prev_hash: str, nonce: int
) -> str:
    block_string = f"{index}{timestamp}{action}{actor}{prev_hash}{nonce}"
    return hashlib.sha256(block_string.encode()).hexdigest()


def proof_of_work(
    index: int, timestamp: str, action: str, actor: str, prev_hash: str
) -> tuple[int, str]:
    target = "0" * DIFFICULTY
    nonce = 0
    while True:
        h = calculate_block_hash(index, timestamp, action, actor, prev_hash, nonce)
        if h.startswith(target):
            return nonce, h
        nonce += 1


def _store():
    # Local import to avoid a circular import at module load time.
    from app.services.storage import get_store

    return get_store()


_SEED_LEDGER_PATH = Path(__file__).resolve().parent.parent.parent / "database" / "blockchain_ledger.json"
_seed_cache: Dict[str, List[Dict]] = {}


def _load_seed_ledger() -> Dict[str, List[Dict]]:
    global _seed_cache
    if _seed_cache:
        return _seed_cache
    try:
        with open(_SEED_LEDGER_PATH, "r") as f:
            _seed_cache = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        _seed_cache = {}
    return _seed_cache


def get_existing_ledger(product_id: str) -> List[Dict] | None:
    """Return the existing ledger for *product_id*, or None if not found."""
    store = _store()
    chain = store.get_ledger(product_id)
    if chain:
        return chain
    # Fallback: check the seed JSON file (pre-populated genesis chains).
    seed = _load_seed_ledger()
    return seed.get(product_id)


def get_or_create_ledger(product_id: str) -> List[Dict]:
    store = _store()
    chain = store.get_ledger(product_id)
    if chain:
        return chain

    now = datetime.now()
    t1 = (now - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    t2 = (now - timedelta(days=28)).strftime("%Y-%m-%d %H:%M:%S")
    t3 = (now - timedelta(days=25)).strftime("%Y-%m-%d %H:%M:%S")

    n1, h1 = proof_of_work(1, t1, "Artisan Identity & Workshop Verified", "Viraasat Registrar", "0" * 16)
    genesis = {
        "index": 1,
        "timestamp": t1,
        "action": "Artisan Identity & Workshop Verified",
        "actor": "Viraasat Registrar",
        "hash": h1,
        "prev_hash": "0" * 16,
        "nonce": n1,
    }
    store.append_ledger_block(product_id, genesis)

    n2, h2 = proof_of_work(2, t2, "GI Tag Authentication & Quality Test Passed", "Handicrafts Development Board", h1)
    block2 = {
        "index": 2,
        "timestamp": t2,
        "action": "GI Tag Authentication & Quality Test Passed",
        "actor": "Handicrafts Development Board",
        "hash": h2,
        "prev_hash": h1,
        "nonce": n2,
    }
    store.append_ledger_block(product_id, block2)

    n3, h3 = proof_of_work(3, t3, "Digital Passport Issued & Genesis Block Mined", "Viraasat Blockchain Node", h2)
    block3 = {
        "index": 3,
        "timestamp": t3,
        "action": "Digital Passport Issued & Genesis Block Mined",
        "actor": "Viraasat Blockchain Node",
        "hash": h3,
        "prev_hash": h2,
        "nonce": n3,
    }
    store.append_ledger_block(product_id, block3)

    return [genesis, block2, block3]


def perform_transfer_ownership(product_id: str, new_owner: str, tx_value: float) -> dict:
    store = _store()
    chain = store.get_ledger(product_id)
    if not chain:
        get_or_create_ledger(product_id)
        chain = store.get_ledger(product_id)

    prev = chain[-1]
    new_index = len(chain) + 1
    t = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action = f"Ownership Transferred (Tx Value: ₹{tx_value})"
    n, h = proof_of_work(new_index, t, action, new_owner, prev["hash"])

    block = {
        "index": new_index,
        "timestamp": t,
        "action": action,
        "actor": new_owner,
        "hash": h,
        "prev_hash": prev["hash"],
        "nonce": n,
    }
    store.append_ledger_block(product_id, block)
    return {"status": "success", "block_added": block}


def is_chain_valid(ledger: List[Dict]) -> bool:
    for i in range(1, len(ledger)):
        curr = ledger[i]
        prev = ledger[i - 1]
        recalculated = calculate_block_hash(
            curr["index"], curr["timestamp"], curr["action"], curr["actor"], curr["prev_hash"], curr["nonce"]
        )
        if curr["hash"] != recalculated:
            return False
        if curr["prev_hash"] != prev["hash"]:
            return False
        if not curr["hash"].startswith("0" * DIFFICULTY):
            return False
    return True
