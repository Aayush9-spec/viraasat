"""Clerk JWT verification dependency for FastAPI.

Clerk signs session JWTs with RS256. The public keys are published at
    https://<YOUR_CLERK_FRONTEND>/.well-known/jwks.json
We fetch and cache them, then verify the `Authorization: Bearer <token>` header.

In development (ENVIRONMENT=development) you can disable verification by setting
REQUIRE_AUTH=false. Never do this in production.
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

logger = logging.getLogger(__name__)

ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
JWKS_URL = os.getenv(
    "CLERK_JWKS_URL",
    f"{ISSUER}/.well-known/jwks.json" if ISSUER else "",
)
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# --- Production guard ---
if not REQUIRE_AUTH and ENVIRONMENT == "production":
    raise RuntimeError(
        "REQUIRE_AUTH must not be false in production. "
        "Set ENVIRONMENT to something other than 'production' to allow REQUIRE_AUTH=false."
    )

_bearer = HTTPBearer(auto_error=False)

_jwks_cache: Dict[str, Any] = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # 1 hour

# --- Lazy Firebase Admin (for Firestore role fallback) ---
_firebase_admin_app: Any = None


def _get_firebase_app() -> Any:
    """Initialise Firebase Admin once from FIREBASE_SERVICE_ACCOUNT_JSON."""
    global _firebase_admin_app
    if _firebase_admin_app is not None:
        return _firebase_admin_app

    raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    if not raw:
        return None

    try:
        import firebase_admin  # type: ignore[import-untyped]
        from firebase_admin import credentials  # type: ignore[import-untyped]

        creds_dict = json.loads(raw)
        cred = credentials.Certificate(creds_dict)
        _firebase_admin_app = firebase_admin.initialize_app(cred)
        return _firebase_admin_app
    except Exception:
        logger.warning(
            "Failed to initialise Firebase Admin; Firestore role fallback is disabled.",
            exc_info=True,
        )
        return None


async def _resolve_role_from_firestore(uid: str) -> Optional[str]:
    """Read role from Firestore ``users/{uid}`` as a fallback."""
    try:
        app = _get_firebase_app()
        if app is None:
            return None

        from firebase_admin import firestore  # type: ignore[import-untyped]

        db = firestore.client(app)
        doc = db.collection("users").document(uid).get()
        if not doc.exists:
            return None
        role = doc.to_dict().get("role")
        return role if isinstance(role, str) else None
    except Exception:
        logger.debug("Firestore role lookup failed for uid %s", uid, exc_info=True)
        return None


async def _get_jwks() -> Dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and now - _jwks_fetched_at < _JWKS_TTL:
        return _jwks_cache
    if not JWKS_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CLERK_JWKS_URL is not configured",
        )
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(JWKS_URL)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        return _jwks_cache


def _key_from_jwks(jwks: Dict[str, Any], kid: str) -> Optional[Dict[str, Any]]:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Dict[str, Any]:
    """Verify the Clerk session JWT and return the decoded claims.

    Returned dict always contains ``userId``; optionally ``role`` and ``email``.
    """
    if not REQUIRE_AUTH:
        # Dev only: accept any caller; surface a synthetic identity.
        return {"userId": "dev-anonymous", "role": "dev", "devBypass": True}

    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        unverified_header = jwt.get_unverified_header(creds.credentials)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header")

        jwks = await _get_jwks()
        key = _key_from_jwks(jwks, kid)
        if key is None:
            raise HTTPException(status_code=401, detail="Signing key not found")

        claims = jwt.decode(
            creds.credentials,
            key,
            algorithms=[key.get("alg", "RS256")],
            issuer=ISSUER or None,
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=401, detail=f"Invalid token: {exc}"
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach auth provider: {exc}",
        ) from exc

    # --- Role resolution ---
    # Try JWT claims first, then fall back to Firestore.
    jwt_role = claims.get("role") or claims.get("metadata", {}).get("role")
    role = jwt_role

    if not role:
        uid = claims.get("sub")
        if uid:
            role = await _resolve_role_from_firestore(str(uid))

    return {
        "userId": claims.get("sub"),
        "role": role,
        "email": claims.get("email"),
    }


def require_role(*roles: str):
    """Factory for a role-checking dependency."""

    async def _checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user.get("devBypass"):
            return user
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user

    return _checker
