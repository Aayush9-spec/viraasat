# CSAM Compliance Guide

> **Legal disclaimer:** This document is a technical setup guide, not legal advice. If you host user-generated imagery — or serve users in the US, EU, UK, Canada, Australia, New Zealand, or any jurisdiction with mandatory CSA(M) reporting laws — you are **legally required** to integrate an approved CSAM detection solution. Consult qualified counsel.

## Why this exists

The `/api/moderate-image` endpoint uses Google Cloud Vision SafeSearch for **general policy enforcement** (nudity, violence, racy content). SafeSearch is *not* a CSAM detection tool. It will not catch known CSAM hashes or report to NCMEC.

For production deployments serving users where CSA(M) reporting is mandatory, you must add a dedicated CSAM hash-matching layer on top of the existing moderation pipeline.

## Integration requirements

| Requirement | Status |
|---|---|
| Microsoft PhotoDNA or PhotoDNA-Online (Global Search) | ✅ Official |
| Google Cloud `csam.search` API (if available in your region) | ✅ Official |
| Hashlist must be refreshed nightly | ✅ Recommended |
| Positive match → block upload + notify moderation team + file NCMEC report | ✅ Required |
| `CSAM_HASH_ENABLED` must be explicitly set to `true` in production | ✅ Enforced |

## Current implementation (stopgap)

The offline dhash matcher in `backend/app/api/moderation.py` is a **fallback watcher**, not a compliance solution:

- Uses a perceptual dhash (8×8 luminance difference hash).
- Compares against `/run/secrets/csam-hashes` (newline-separated hex hashes).
- Hamming distance threshold: 5/64 (adjust based on false-positive testing).
- On hit: blocks the upload, logs `CSAM hash HIT`, returns `reason=csam_hash_match`.

> This will NOT detect CSAM that isn't already in your hashlist. It cannot replace PhotoDNA's global database.

## Production rollout checklist

1. **Partner with Microsoft** to get PhotoDNA / PhotoDNA-Online (Global Search) credentials and API access.
2. **Provision** the official SDK/hashlist in your deployment. You may replace `_perceptual_dhash` + `_load_csam_hashes` with a direct PhotoDNA API call.
3. **File a report** integration: on hash match, call NCMEC's CyberTipline API (or your local equivalent) from a dedicated, logged worker.
4. **Set `CSAM_HASH_ENABLED=true`** in your production environment.
5. **Test** with known-good and known-flagged hashes in staging (do not use real CSAM samples — use provided test fixtures).
6. **Monitor** the moderation logs for `csam_hash_match` events and alert on 5xx responses from the NCMEC reporter.
7. **Document** the chain of custody for every hash hit (who was notified, when, what was uploaded, what report was filed).

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `CSAM_HASH_ENABLED` | `false` | Must be `true` for the offline hash matcher to run at all. |
| `CSAM_HASH_FILE` | `/run/secrets/csam-hashes` | Path to the newline-separated dhash hex list (Kubernetes secret mount recommended). |
| `GOOGLE_CLOUD_VISION_ENABLED` | `true` | Toggles SafeSearch stage; keep `true` for general moderation. |

## What is NOT backed up here

- The hashlist itself (managed by your moderation tooling team, not this repo).
- NCMEC / law enforcement reporting (manual or integrated separately).
- Jurisdiction-specific escalation paths.
