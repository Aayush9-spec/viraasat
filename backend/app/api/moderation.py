"""Image moderation endpoint.

Accepts a multipart image upload, runs Google Cloud Vision SafeSearch, and
returns a verdict. The FE MUST gate the actual upload-to-Firebase-Storage
step on a `verdict.allow == true` response.

If `GOOGLE_CLOUD_VISION_ENABLED` is not set to `true` (or the credentials
are unavailable), the endpoint falls back to a basic size / MIME-type check
and returns `verdict.reason = "safe_search_disabled"`. The FE should treat
this as a soft pass and log it for review.
"""
from __future__ import annotations

import base64
import logging
import os
from typing import Any, Dict, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

_limiter = Limiter(key_func=get_remote_address)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}

# Anything in these SafeSearch categories at LIKELY or higher is rejected.
# (UNKNOWN is treated as "no signal" and not a rejection trigger.)
REJECT_LIKELIHOOD = {"LIKELY", "VERY_LIKELY"}
REJECT_CATEGORIES = {"adult", "violence", "racy"}


class Verdict(BaseModel):
    allow: bool
    reason: str
    details: Dict[str, Any] = {}


def _safe_search_disabled_response() -> Verdict:
    return Verdict(
        allow=True,
        reason="safe_search_disabled",
        details={"hint": "Set GOOGLE_CLOUD_VISION_ENABLED=true for moderation"},
    )


def _call_vision_safesearch(image_bytes: bytes) -> Dict[str, str]:
    """Returns a dict of category -> likelihood (UNKNOWN, UNLIKELY, etc.)."""
    try:
        from google.cloud import vision  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("google-cloud-vision not installed") from exc

    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    response = client.safe_search_detection(image=image)
    safe = response.safe_search_annotation
    return {
        "adult": safe.adult.name,
        "spoof": safe.spoof.name,
        "medical": safe.medical.name,
        "violence": safe.violence.name,
        "racy": safe.racy.name,
    }


@router.post("/moderate-image", response_model=Verdict)
@router.post("/moderate-image/", response_model=Verdict)
@_limiter.limit("30/minute")
async def moderate_image(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> Verdict:
    if user.get("devBypass") is not True and user.get("role") not in {"artisan", "admin"}:
        raise HTTPException(status_code=403, detail="Only artisans can upload images")

    if file.content_type not in ALLOWED_MIME:
        return Verdict(allow=False, reason="unsupported_mime_type", details={"content_type": file.content_type})

    contents = await file.read()
    if len(contents) > MAX_IMAGE_BYTES:
        return Verdict(allow=False, reason="file_too_large", details={"max_bytes": MAX_IMAGE_BYTES})
    if len(contents) < 1024:
        return Verdict(allow=False, reason="file_too_small", details={"min_bytes": 1024})

    if os.getenv("GOOGLE_CLOUD_VISION_ENABLED", "true").lower() != "true":
        return _safe_search_disabled_response()

    try:
        scores = _call_vision_safesearch(contents)
    except Exception as exc:
        logger.error("Vision SafeSearch failed: %s", exc)
        # Fail closed on real errors: an unreachable moderator is not a green
        # light. The FE will surface this and the artisan can retry.
        return Verdict(allow=False, reason="moderation_unavailable", details={"error": str(exc)})

    flagged = {cat: lvl for cat, lvl in scores.items() if cat in REJECT_CATEGORIES and lvl in REJECT_LIKELIHOOD}
    if flagged:
        return Verdict(allow=False, reason="policy_violation", details={"flagged": flagged, "scores": scores})

    return Verdict(allow=True, reason="ok", details={"scores": scores})
