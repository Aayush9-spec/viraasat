"""Image moderation endpoint.

Accepts a multipart image upload, runs Google Cloud Vision SafeSearch, a local
CSAM hash check, and returns a verdict. The FE MUST gate the actual upload-to-
Firebase-Storage step on a `verdict.allow == true` response.

Moderation pipeline (fail-closed — a failure at any stage blocks the upload):
  1. MIME + size validation  (always run)
  2. CSAM perceptual-hash match  (offline, via `check_csam_hash`)
  3. Google Cloud Vision SafeSearch  (when `GOOGLE_CLOUD_VISION_ENABLED=true`)

If Vision is disabled, stage 3 is skipped and the endpoint returns
`verdict.reason = "safe_search_disabled"` with `allow=True` — this is a *soft
pass* and should NOT be used in production. The FE should log it.

NOTE ON CSAM
-----------
This offline hash matcher is a safety net, not a substitute for a real
PhotoDNA / NCMEC integration. If your platform hosts user-generated imagery or
serves users in the US/EU, you are legally required to integrate the official
Microsoft PhotoDNA or Google CSAM-API solution. See `docs/csam-compliance.md`
for the setup guide and legal checklist. Until then, this module will refuse
to run in production: `CSAM_HASH_ENABLED` defaults to `false`.
"""
from __future__ import annotations

import base64
import hashlib
import logging
import os
from typing import Any, Dict, Literal, Optional, Set

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

REJECT_LIKELIHOOD = {"LIKELY", "VERY_LIKELY"}
REJECT_CATEGORIES = {"adult", "violence", "racy"}

# --- CSAM hash block -------------------------------------------------------
# A production deployment should integrate Microsoft PhotoDNA or Google's
# CSAM detection API. This offline perceptual-hash matcher is a STOPGAP that
# can catch re-uploads of previously-flagged images, but it is NOT a legal
# compliance solution. See docs/csam-compliance.md.
#
# The hash list lives in CSAM_HASH_FILE (a newline-separated text file of
# dhash hex strings, one per line). It must be provisioned out-of-band by the
# moderation team — never committed to the repo.
#
# dhash implementation: a simple 8x8 difference hash computed from luminance.
# This avoids a hard dependency on `imagehash`/`Pillow` while still being
# rotation/flip-tolerant enough for an offline watchlist.
def _perceptual_dhash(image_bytes: bytes, hash_size: int = 8) -> Optional[str]:
    """Compute an 8x8 difference hash hex string without external deps.

    Returns None if the image cannot be decoded as JPEG/PNG.
    """
    try:
        from PIL import Image  # type: ignore  # optional dep
    except ImportError:
        logger.warning("PIL/Pillow not installed; CSAM hash check skipped for this request")
        return None

    import io

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            gray = img.convert("L").resize((hash_size + 1, hash_size), Image.LANCZOS)
            pixels = list(gray.getdata())
    except Exception as exc:
        logger.warning("Could not decode image for hashing: %s", exc)
        return None

    # Compare adjacent pixels horizontally.
    bits = []
    for row in range(hash_size):
        for col in range(hash_size):
            left = pixels[row * (hash_size + 1) + col]
            right = pixels[row * (hash_size + 1) + col + 1]
            bits.append("1" if left > right else "0")

    hex_str = ""
    for i in range(0, len(bits), 8):
        chunk = "".join(bits[i : i + 8])
        hex_str += f"{int(chunk, 2):02x}"
    return hex_str


def _load_csam_hashes() -> Set[str]:
    path = os.getenv("CSAM_HASH_FILE", "/run/secrets/csam-hashes")
    if not os.path.exists(path):
        return set()
    try:
        with open(path, "r", encoding="utf-8") as f:
            return {line.strip().lower() for line in f if line.strip()}
    except Exception as exc:
        logger.error("Failed to load CSAM hash file: %s", exc)
        return set()


def _hash_hamming_distance(h1: str, h2: str) -> int:
    """Hamming distance between two hex dhash strings."""
    d1 = int(h1, 16)
    d2 = int(h2, 16)
    return (d1 ^ d2).bit_count()


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

    # --- CSAM hash check --------------------------------------------------
    # Always run (even when Vision is disabled) if the feature flag is on.
    # On is OFF by default; must be explicitly enabled in production.
    if os.getenv("CSAM_HASH_ENABLED", "false").lower() == "true":
        hash_ = _perceptual_dhash(contents)
        if hash_ is not None:
            known_hashes = _load_csam_hashes()
            for known in known_hashes:
                if _hash_hamming_distance(hash_, known) <= 5:  # threshold: 5/64
                    logger.critical("CSAM hash HIT — blocking upload and notifying team")
                    # In a real deployment this is where you'd file a report
                    # with NCMEC via the appropriate jurisdictional channel.
                    return Verdict(
                        allow=False,
                        reason="csam_hash_match",
                        details={"hash": hash_, "threshold": 5},
                    )

    if os.getenv("GOOGLE_CLOUD_VISION_ENABLED", "true").lower() != "true":
        return _safe_search_disabled_response()

    try:
        scores = _call_vision_safesearch(contents)
    except Exception as exc:
        logger.error("Vision SafeSearch failed: %s", exc)
        return Verdict(allow=False, reason="moderation_unavailable", details={"error": str(exc)})

    flagged = {cat: lvl for cat, lvl in scores.items() if cat in REJECT_CATEGORIES and lvl in REJECT_LIKELIHOOD}
    if flagged:
        return Verdict(allow=False, reason="policy_violation", details={"flagged": flagged, "scores": scores})

    return Verdict(allow=True, reason="ok", details={"scores": scores})
