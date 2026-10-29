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


def get_existing_ledger(product_id: str) -> List[Dict] | None:
    """Return the existing ledger for *product_id*, or None if not found."""
    store = _store()
    chain = store.get_ledger(product_id)
    if chain:
        return chain
    return None


def get_or_create_ledger(product_id: str, owner_id: str = "unassigned") -> List[Dict]:
    store = _store()
    chain = store.get_ledger(product_id)
    if chain:
        return chain
    now = datetime.now().isoformat()
    action = "Ledger registered; physical authenticity and GI origin not verified"
    nonce, block_hash = proof_of_work(1, now, action, owner_id, "0" * 16)
    block = {"index": 1, "timestamp": now, "action": action, "actor": owner_id,
             "hash": block_hash, "prev_hash": "0" * 16, "nonce": nonce}
    store.append_ledger_block(product_id, block)
    return [block]


def perform_transfer_ownership(product_id: str, new_owner: str, tx_value: float, caller_id: str | None = None) -> dict:
    store = _store()
    chain = store.get_ledger(product_id)
    if not chain:
        raise ValueError("No ledger exists")
    if not is_chain_valid(chain):
        raise ValueError("Ledger integrity check failed")
    if not caller_id or chain[-1]["actor"] != caller_id:
        raise PermissionError("Only the recorded custodian can transfer this ledger")
    if not new_owner or tx_value < 0:
        raise ValueError("Invalid transfer")

    prev = chain[-1]
    new_index = len(chain) + 1
    t = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action = f"Ledger custody transferred (declared value: ₹{tx_value})"
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
    if not ledger:
        return False
    try:
        for i, curr in enumerate(ledger):
            if curr["index"] != i + 1:
                return False
            prev_hash = ledger[i - 1]["hash"] if i else "0" * 16
            if curr["prev_hash"] != prev_hash:
                return False
            recalculated = calculate_block_hash(curr["index"], curr["timestamp"], curr["action"], curr["actor"], curr["prev_hash"], curr["nonce"])
            if curr["hash"] != recalculated or not curr["hash"].startswith("0" * DIFFICULTY):
                return False
        return True
    except (KeyError, TypeError, ValueError):
        return False
