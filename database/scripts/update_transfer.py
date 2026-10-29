import os

router_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/app/api/v1/router.py"))
with open(router_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """@api_router.post("/blockchain/transfer")
@_limiter.limit("10/minute")
async def transfer_ownership(
    request: Request,
    product_id: str,
    new_owner: str,
    tx_value: float,
    user: dict = Depends(require_role("artisan", "admin")),
):
    existing = get_existing_ledger(product_id)
    if not existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No provenance chain for this product")
    return perform_transfer_ownership(product_id, new_owner, tx_value)


# ---- Authenticated (fraud detection) ----
@api_router.post("/fraud/detect")
@_limiter.limit("30/minute")
async def detect_fraud(
    request: Request,
    payload: ReviewAnomalyInput,
    user: dict = Depends(require_role("admin", "artisan")),
):
    return detect_review_fraud(payload)"""

replacement = """from pydantic import BaseModel

class TransferOwnershipInput(BaseModel):
    product_id: str
    new_owner: str
    tx_value: float = 0.0

@api_router.post("/blockchain/transfer")
@_limiter.limit("10/minute")
async def transfer_ownership(
    request: Request,
    payload: TransferOwnershipInput,
    user: Optional[dict] = Depends(get_optional_user),
):
    existing = get_existing_ledger(payload.product_id)
    if not existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No provenance chain for this product")
    return perform_transfer_ownership(payload.product_id, payload.new_owner, payload.tx_value)


# ---- Fraud Detection ----
@api_router.post("/fraud/detect")
@_limiter.limit("30/minute")
async def detect_fraud(
    request: Request,
    payload: ReviewAnomalyInput,
    user: Optional[dict] = Depends(get_optional_user),
):
    return detect_review_fraud(payload)"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open(router_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully updated transfer & fraud endpoints in router.py!")
else:
    print("Target not found, verifying normalized newlines...")
    norm_text = text.replace("\r\n", "\n")
    norm_target = target.replace("\r\n", "\n")
    if norm_target in norm_text:
        norm_text = norm_text.replace(norm_target, replacement.replace("\r\n", "\n"), 1)
        with open(router_path, "w", encoding="utf-8") as f:
            f.write(norm_text)
        print("Successfully updated transfer & fraud endpoints with normalized newlines!")
    else:
        print("Target still not found")

