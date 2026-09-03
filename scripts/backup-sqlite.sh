#!/usr/bin/env bash
# Backup the FastAPI SQLite database (blockchain ledger + knowledge graph
# cache) to a GCS bucket. Safe to run while the API is up; SQLite's WAL
# mode means readers don't block the backup copy.
#
# Usage:
#   ./scripts/backup-sqlite.sh <GCS_BUCKET> [SQLITE_PATH]
#   e.g. ./scripts/backup-sqlite.sh gs://viraasat-backups ./viraasat.db
set -euo pipefail

BUCKET="${1:-${BACKUP_BUCKET:-}}"
SQLITE_PATH="${2:-${SQLITE_PATH:-./viraasat.db}}"

if [[ -z "$BUCKET" ]]; then
  echo "❌ Usage: $0 <GCS_BUCKET> [SQLITE_PATH]" >&2
  exit 1
fi

if [[ ! -f "$SQLITE_PATH" ]]; then
  echo "❌ SQLite file not found: $SQLITE_PATH" >&2
  exit 1
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="sqlite-$(basename "$SQLITE_PATH")-${TIMESTAMP}.db"
DEST="${BUCKET%/}/${BACKUP_NAME}"

echo ">>> Copying $SQLITE_PATH to $DEST"
gsutil cp "$SQLITE_PATH" "$DEST"
echo "✅ Backup complete: $DEST"
