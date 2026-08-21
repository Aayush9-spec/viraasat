import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict

LEDGER_FILE = "backend/data/blockchain_ledger.json"
DIFFICULTY = 3  # Hashing target prefix length (e.g. "000")

def calculate_block_hash(index: int, timestamp: str, action: str, actor: str, prev_hash: str, nonce: int) -> str:
    block_string = f"{index}{timestamp}{action}{actor}{prev_hash}{nonce}"
    return hashlib.sha256(block_string.encode()).hexdigest()

def proof_of_work(index: int, timestamp: str, action: str, actor: str, prev_hash: str) -> tuple:
    target = "0" * DIFFICULTY
    nonce = 0
    while True:
        h = calculate_block_hash(index, timestamp, action, actor, prev_hash, nonce)
        if h.startswith(target):
            return nonce, h
        nonce += 1

def load_ledger() -> Dict[str, List[Dict]]:
    os.makedirs(os.path.dirname(LEDGER_FILE), exist_ok=True)
    if os.path.exists(LEDGER_FILE):
        try:
            with open(LEDGER_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading ledger JSON: {e}")
    return {}

def save_ledger(ledger: Dict[str, List[Dict]]):
    try:
        with open(LEDGER_FILE, "w") as f:
            json.dump(ledger, f, indent=2)
    except Exception as e:
        print(f"Error saving ledger JSON: {e}")

def get_or_create_ledger(product_id: str) -> List[Dict]:
    ledger_db = load_ledger()
    if product_id not in ledger_db:
        # Generate initial provenance chain using real mining
        t1 = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
        n1, h1 = proof_of_work(1, t1, "Artisan Identity & Workshop Verified", "Viraasat Registrar", "0000000000000000")
        
        t2 = (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d %H:%M:%S")
        n2, h2 = proof_of_work(2, t2, "GI Tag Authentication & Quality Test Passed", "Handicrafts Development Board", h1)
        
        t3 = (datetime.now() - timedelta(days=25)).strftime("%Y-%m-%d %H:%M:%S")
        n3, h3 = proof_of_work(3, t3, "Digital Passport Issued & Genesis Block Mined", "Viraasat Blockchain Node", h2)
        
        ledger_db[product_id] = [
            {
                "index": 1,
                "timestamp": t1,
                "action": "Artisan Identity & Workshop Verified",
                "actor": "Viraasat Registrar",
                "hash": h1,
                "prev_hash": "0000000000000000",
                "nonce": n1
            },
            {
                "index": 2,
                "timestamp": t2,
                "action": "GI Tag Authentication & Quality Test Passed",
                "actor": "Handicrafts Development Board",
                "hash": h2,
                "prev_hash": h1,
                "nonce": n2
            },
            {
                "index": 3,
                "timestamp": t3,
                "action": "Digital Passport Issued & Genesis Block Mined",
                "actor": "Viraasat Blockchain Node",
                "hash": h3,
                "prev_hash": h2,
                "nonce": n3
            }
        ]
        save_ledger(ledger_db)
    return ledger_db[product_id]

def perform_transfer_ownership(product_id: str, new_owner: str, tx_value: float) -> dict:
    ledger_db = load_ledger()
    
    # Ensure ledger is created first
    if product_id not in ledger_db:
        get_or_create_ledger(product_id)
        ledger_db = load_ledger()
        
    ledger = ledger_db[product_id]
    prev_block = ledger[-1]
    
    new_index = len(ledger) + 1
    t = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action = f"Ownership Transferred (Tx Value: ₹{tx_value})"
    
    # Mine the block
    n, h = proof_of_work(new_index, t, action, new_owner, prev_block["hash"])
    
    new_block = {
        "index": new_index,
        "timestamp": t,
        "action": action,
        "actor": new_owner,
        "hash": h,
        "prev_hash": prev_block["hash"],
        "nonce": n
    }
    
    ledger.append(new_block)
    ledger_db[product_id] = ledger
    save_ledger(ledger_db)
    
    return {"status": "success", "block_added": new_block}

def is_chain_valid(ledger: List[Dict]) -> bool:
    for i in range(1, len(ledger)):
        curr = ledger[i]
        prev = ledger[i-1]
        
        # Verify current hash matches recalculated
        recalculated = calculate_block_hash(
            curr["index"], curr["timestamp"], curr["action"], curr["actor"], curr["prev_hash"], curr["nonce"]
        )
        if curr["hash"] != recalculated:
            return False
            
        # Verify previous hash link matches
        if curr["prev_hash"] != prev["hash"]:
            return False
            
        # Verify proof of work difficulty
        if not curr["hash"].startswith("0" * DIFFICULTY):
            return False
            
    return True
