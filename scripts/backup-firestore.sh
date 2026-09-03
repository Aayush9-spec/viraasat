#!/usr/bin/env bash
# Export every Firestore collection to Cloud Storage as a daily backup.
# Schedule this as a Cloud Run job or Cloud Scheduler -> Cloud Functions
# trigger. The exported file format is the standard Firestore export, which
# can be re-imported with `gcloud firestore import`.
#
# Required:
#   - GOOGLE_APPLICATION_CREDENTIALS or workload-identity on the runner
#   - A GCS bucket you own: gs://YOUR-BUCKET/firestore-backups/
#
# Usage:
#   ./scripts/backup-firestore.sh <PROJECT_ID> <BUCKET>
#   e.g. ./scripts/backup-firestore.sh viraasat-ai gs://viraasat-backups
set -euo pipefail

PROJECT_ID="${1:-${FIREBASE_PROJECT_ID:-}}"
BUCKET="${2:-${BACKUP_BUCKET:-}}"

if [[ -z "$PROJECT_ID" || -z "$BUCKET" ]]; then
  echo "❌ Usage: $0 <PROJECT_ID> <GCS_BUCKET>" >&2
  echo "   e.g. $0 viraasat-ai gs://viraasat-backups" >&2
  exit 1
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${BUCKET%/}/firestore-backups/${TIMESTAMP}"

echo ">>> Backing up Firestore from project '$PROJECT_ID' to '$DEST'"

gcloud firestore export "$DEST" \
  --project="$PROJECT_ID" \
  --async

echo "✅ Export started. Check status with:"
echo "   gcloud firestore operations list --project=$PROJECT_ID"
echo
echo "To restore (DESTRUCTIVE — overwrites current data):"
echo "   gcloud firestore import $DEST --project=$PROJECT_ID"
