import os
from datetime import datetime, timedelta
from typing import List, Dict

# In-Memory Blockchain ledger simulator
BLOCKCHAIN_LEDGER: Dict[str, List[Dict]] = {}

def get_or_create_ledger(product_id: str) -> List[Dict]:
    if product_id not in BLOCKCHAIN_LEDGER:
        # Generate initial provenance chain
        h1 = os.urandom(8).hex()
        h2 = os.urandom(8).hex()
        h3 = os.urandom(8).hex()
        
        BLOCKCHAIN_LEDGER[product_id] = [
            {
                "index": 1,
                "timestamp": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S"),
                "action": "Artisan Identity & Workshop Verified",
                "actor": "Viraasat Registrar",
                "hash": h1,
                "prev_hash": "0000000000000000"
            },
            {
                "index": 2,
                "timestamp": (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d %H:%M:%S"),
                "action": "GI Tag Authentication & Quality Test Passed",
                "actor": "Handicrafts Development Board",
                "hash": h2,
                "prev_hash": h1
            },
            {
                "index": 3,
                "timestamp": (datetime.now() - timedelta(days=25)).strftime("%Y-%m-%d %H:%M:%S"),
                "action": "Digital Passport Issued & Genesis Block Mined",
                "actor": "Viraasat Blockchain Node",
                "hash": h3,
                "prev_hash": h2
            }
        ]
    return BLOCKCHAIN_LEDGER[product_id]

def perform_transfer_ownership(product_id: str, new_owner: str, tx_value: float) -> dict:
    ledger = get_or_create_ledger(product_id)
    prev_block = ledger[-1]
    
    new_index = len(ledger) + 1
    new_hash = os.urandom(8).hex()
    
    new_block = {
        "index": new_index,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "action": f"Ownership Transferred (Tx Value: ₹{tx_value})",
        "actor": new_owner,
        "hash": new_hash,
        "prev_hash": prev_block["hash"]
    }
    
    ledger.append(new_block)
    return {"status": "success", "block_added": new_block}
