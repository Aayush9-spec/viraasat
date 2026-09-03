#!/usr/bin/env bash
# Deploy all Firebase assets: rules + composite indexes.
# Usage:  ./scripts/deploy-firebase.sh [--project <PROJECT_ID>]
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
if [[ "${1:-}" == "--project" && -n "${2:-}" ]]; then
  PROJECT_ID="$2"
fi

if [[ -z "$PROJECT_ID" ]]; then
  # Fall back to the active project set with `firebase use`.
  PROJECT_ID="$(firebase use 2>/dev/null | awk -F'[()]' '/Current project/ {print $2; exit}')"
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ No Firebase project configured. Run 'firebase use --add <PROJECT_ID>' or pass --project." >&2
  exit 1
fi

echo ">>> Deploying rules, indexes, and storage to project: $PROJECT_ID"
firebase deploy \
  --project "$PROJECT_ID" \
  --only "firestore:rules,firestore:indexes,storage"

echo "✅ Done. Note: Firestore index builds can take a few minutes."
