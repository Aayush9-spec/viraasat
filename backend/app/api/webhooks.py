"""Clerk → Firestore user sync.

Materializes a Firestore `users/{clerkUserId}` document whenever Clerk
emits a `user.created` / `user.updated` / `user.deleted` event. The FE
used to write the user doc itself on every page load; this webhook is
the source of truth now, so role / email / image data cannot drift.

Configure in the Clerk Dashboard (Webhooks → Add Endpoint):
  URL:    https://YOUR_BACKEND/api/webhooks/clerk
  Events: user.created, user.updated, user.deleted
  Secret: copy the value into the backend's CLERK_WEBHOOK_SIGNING_SECRET env var
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SIGNING_SECRET", "")


def _admin_db():
    """Lazy import so test environments without firebase-admin can still run."""
    try:
        import firebase_admin
        from firebase_admin import firestore

        if not firebase_admin._apps:
            _init_firebase()
        return firestore.client()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"firestore unavailable: {exc}") from exc


def _init_firebase() -> None:
    import base64

    import firebase_admin
    from firebase_admin import credentials

    cred_b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if cred_b64:
        decoded = base64.b64decode(cred_b64).decode()
        cred = credentials.Certificate(json.loads(decoded))
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()


# ---------------------------------------------------------------------------
# Signature verification
# ---------------------------------------------------------------------------


def _verify_signature(raw_body: bytes, headers: Dict[str, str]) -> bool:
    if not CLERK_WEBHOOK_SECRET:
        logger.error("CLERK_WEBHOOK_SIGNING_SECRET is not configured")
        return False

    svix_id = headers.get("svix-id", "")
    svix_ts = headers.get("svix-timestamp", "")
    svix_sig = headers.get("svix-signature", "")
    if not (svix_id and svix_ts and svix_sig):
        return False

    # Reject events older than 5 minutes to limit replay windows.
    try:
        ts = int(svix_ts)
    except ValueError:
        return False
    if abs(int(datetime.now(timezone.utc).timestamp()) - ts) > 300:
        return False

    signed = f"{svix_id}.{svix_ts}.{raw_body.decode('utf-8')}"
    digest = hmac.new(
        CLERK_WEBHOOK_SECRET.encode(), signed.encode(), hashlib.sha256
    ).hexdigest()
    expected = f"v1,{digest}"
    # svix-signature can contain multiple space-separated signatures.
    return any(hmac.compare_digest(expected, candidate) for candidate in svix_sig.split())


# ---------------------------------------------------------------------------
# Firestore materialization
# ---------------------------------------------------------------------------


def _extract_user_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Map Clerk's payload to our Firestore user shape."""
    user_id = payload.get("id")
    if not user_id:
        raise ValueError("payload missing 'id'")

    email_addresses = payload.get("email_addresses") or []
    primary_email_id = payload.get("primary_email_address_id")
    primary_email = next(
        (e["email_address"] for e in email_addresses if e.get("id") == primary_email_id),
        email_addresses[0]["email_address"] if email_addresses else "",
    )

    role = (
        (payload.get("unsafe_metadata") or {}).get("role")
        or (payload.get("public_metadata") or {}).get("role")
        or "customer"
    )

    name = " ".join(
        filter(None, [payload.get("first_name"), payload.get("last_name")])
    ).strip() or (payload.get("username") or primary_email or "User")

    return {
        "clerkUserId": user_id,
        "uid": user_id,
        "name": name,
        "email": primary_email,
        "imageUrl": payload.get("image_url", ""),
        "role": role,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request) -> Dict[str, Any]:
    raw = await request.body()
    headers = {k.lower(): v for k, v in request.headers.items()}

    if not _verify_signature(raw, headers):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        event = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    event_type = event.get("type")
    data = event.get("data") or {}

    db = _admin_db()
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user id")

    user_ref = db.collection("users").document(user_id)

    if event_type == "user.deleted":
        user_ref.delete()
        logger.info("clerk webhook: deleted firestore user %s", user_id)
        return {"received": True, "action": "deleted"}

    if event_type in ("user.created", "user.updated"):
        record = _extract_user_data(data)
        if event_type == "user.created":
            record["createdAt"] = datetime.fromtimestamp(
                data.get("created_at", 0) / 1000, tz=timezone.utc
            ).isoformat()
        else:
            # Preserve original createdAt on update.
            existing = user_ref.get().to_dict() or {}
            record["createdAt"] = existing.get(
                "createdAt", record["updatedAt"]
            )
        user_ref.set(record, merge=True)
        logger.info(
            "clerk webhook: %s firestore user %s (role=%s)",
            event_type,
            user_id,
            record.get("role"),
        )
        return {"received": True, "action": event_type}

    # Unknown event types are acknowledged but not acted on.
    return {"received": True, "ignored": event_type}
