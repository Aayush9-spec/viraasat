"""Clerk JWT verification dependency for FastAPI.

Clerk signs session JWTs with RS256. The public keys are published at
    https://<YOUR_CLERK_FRONTEND>/.well-known/jwks.json
We fetch and cache them, then verify the `Authorization: Bearer <token>` header.

In development (ENVIRONMENT=development) you can disable verification by setting
REQUIRE_AUTH=false. Never do this in production.
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
JWKS_URL = os.getenv(
    "CLERK_JWKS_URL",
    f"{ISSUER}/.well-known/jwks.json" if ISSUER else "",
)
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

_bearer = HTTPBearer(auto_error=False)

_jwks_cache: Dict[str, Any] = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # 1 hour


async def _get_jwks() -> Dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and now - _jwks_fetched_at < _JWKS_TTL:
        return _jwks_cache
    if not JWKS_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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

    Returned dict always contains `userId`; optionally `role` and `email`.
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

    return {
        "userId": claims.get("sub"),
        "role": claims.get("role") or claims.get("metadata", {}).get("role"),
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
