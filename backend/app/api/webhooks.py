"""Clerk → SQLite user sync.

Materializes a local SQLite ``users`` table (and optionally Firestore) whenever
Clerk emits a ``user.created`` / ``user.updated`` / ``user.deleted`` event.
The user record is the single source of truth for roles consumed by the backend.

Configure in the Clerk Dashboard (Webhooks → Add Endpoint):
  URL:    https://YOUR_BACKEND/api/webhooks/clerk
  Events: user.created, user.updated, user.deleted
  Secret: copy the ``whsec_...`` value into CLERK_WEBHOOK_SIGNING_SECRET
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SIGNING_SECRET", "")

# ---------------------------------------------------------------------------
# SQLite user store (no Firestore dependency)
# ---------------------------------------------------------------------------

_USERS_DB_PATH = os.getenv("SQLITE_PATH", "viraasat.db")
_db_lock = threading.Lock()


def _get_users_db() -> sqlite3.Connection:
    conn = sqlite3.connect(_USERS_DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            clerk_user_id TEXT PRIMARY KEY,
            name          TEXT,
            email         TEXT,
            image_url     TEXT,
            role          TEXT DEFAULT 'customer',
            created_at    TEXT,
            updated_at    TEXT
        )
        """
    )
    conn.commit()
    return conn


# ---------------------------------------------------------------------------
# Signature verification
# ---------------------------------------------------------------------------


def _decode_svix_secret(secret: str) -> bytes:
    """Return the raw HMAC key from a Svix signing secret.

    Clerk (Svix) signing secrets are formatted as ``whsec_<base64>``.
    The ``whsec_`` prefix must be stripped and the remainder base64-decoded
    before use as the HMAC key.  Passing the raw ASCII string as the key
    (the previous behaviour) produces a different digest and makes every
    signature check fail.
    """
    if secret.startswith("whsec_"):
        secret = secret[len("whsec_"):]
    return base64.b64decode(secret)


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
    key = _decode_svix_secret(CLERK_WEBHOOK_SECRET)
    digest = hmac.new(key, signed.encode(), hashlib.sha256).hexdigest()
    expected = f"v1,{digest}"
    # svix-signature can contain multiple space-separated signatures.
    return any(hmac.compare_digest(expected, candidate) for candidate in svix_sig.split())


# ---------------------------------------------------------------------------
# User data extraction
# ---------------------------------------------------------------------------


def _extract_user_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Map Clerk's payload to our user record shape."""
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
        "clerk_user_id": user_id,
        "name": name,
        "email": primary_email,
        "image_url": payload.get("image_url", ""),
        "role": role,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _upsert_user_sqlite(record: Dict[str, Any]) -> None:
    """Write or update a user row in the local SQLite users table."""
    with _db_lock:
        conn = _get_users_db()
        conn.execute(
            """
            INSERT INTO users (clerk_user_id, name, email, image_url, role, created_at, updated_at)
            VALUES (:clerk_user_id, :name, :email, :image_url, :role, :created_at, :updated_at)
            ON CONFLICT(clerk_user_id) DO UPDATE SET
                name       = excluded.name,
                email      = excluded.email,
                image_url  = excluded.image_url,
                role       = excluded.role,
                updated_at = excluded.updated_at
            """,
            {**record, "created_at": record.get("created_at", record["updated_at"])},
        )
        conn.commit()
        conn.close()


def _delete_user_sqlite(clerk_user_id: str) -> None:
    with _db_lock:
        conn = _get_users_db()
        conn.execute("DELETE FROM users WHERE clerk_user_id = ?", (clerk_user_id,))
        conn.commit()
        conn.close()


# ---------------------------------------------------------------------------
# Firestore mirror (optional — skipped when FIREBASE_SERVICE_ACCOUNT_JSON unset)
# ---------------------------------------------------------------------------

def _mirror_to_firestore(event_type: str, user_id: str, record: Dict[str, Any]) -> None:
    """Best-effort Firestore mirror; logs and continues on any error."""
    try:
        import firebase_admin  # type: ignore[import-untyped]
        from firebase_admin import credentials, firestore  # type: ignore[import-untyped]

        cred_b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if not cred_b64:
            return  # Firestore not configured — silently skip

        if not firebase_admin._apps:
            decoded = base64.b64decode(cred_b64).decode()
            cred = credentials.Certificate(json.loads(decoded))
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        user_ref = db.collection("users").document(user_id)

        if event_type == "user.deleted":
            user_ref.delete()
        else:
            # Map SQLite column names → Firestore field names for compatibility
            # with the existing security rules and frontend queries.
            fs_record = {
                "clerkUserId": record["clerk_user_id"],
                "uid": record["clerk_user_id"],
                "name": record["name"],
                "email": record["email"],
                "imageUrl": record["image_url"],
                "role": record["role"],
                "updatedAt": record["updated_at"],
                "createdAt": record.get("created_at", record["updated_at"]),
            }
            user_ref.set(fs_record, merge=True)
    except Exception:
        logger.warning(
            "Firestore mirror failed for user %s (non-fatal; SQLite record is authoritative)",
            user_id,
            exc_info=True,
        )


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

    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user id")

    if event_type == "user.deleted":
        _delete_user_sqlite(user_id)
        _mirror_to_firestore("user.deleted", user_id, {})
        logger.info("clerk webhook: deleted user %s", user_id)
        return {"received": True, "action": "deleted"}

    if event_type in ("user.created", "user.updated"):
        record = _extract_user_data(data)
        if event_type == "user.created":
            record["created_at"] = datetime.fromtimestamp(
                data.get("created_at", 0) / 1000, tz=timezone.utc
            ).isoformat()
        _upsert_user_sqlite(record)
        _mirror_to_firestore(event_type, user_id, record)
        logger.info(
            "clerk webhook: %s user %s (role=%s)",
            event_type,
            user_id,
            record.get("role"),
        )
        return {"received": True, "action": event_type}

    # Unknown event types are acknowledged but not acted on.
    return {"received": True, "ignored": event_type}
