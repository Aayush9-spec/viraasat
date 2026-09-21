#!/bin/bash
# Syncs source files to /tmp/viraasatapp (no-spaces path for Turbopack)
# Run once before `npm run dev` from /tmp/viraasatapp
# Or run with --watch to keep it live during development

SRC="/Volumes/Crucial X9/projects /project /viraasat/viraasat/frontend"
DST="/tmp/viraasatapp"

EXCLUDE=(
  --exclude='.next'
  --exclude='node_modules'
  --exclude='*.log'
)

if [ "$1" = "--watch" ]; then
  echo "👁  Watching for changes..."
  while true; do
    rsync -a --delete "${EXCLUDE[@]}" "$SRC/" "$DST/"
    sleep 2
  done
else
  rsync -a --delete "${EXCLUDE[@]}" "$SRC/" "$DST/"
  echo "✅ Synced to $DST"
fi
