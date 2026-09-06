# Backup & Disaster Recovery

Viraasat stores data in three places, each with its own backup story.

| Where | What lives there | Backup | Restore |
|---|---|---|---|
| **Firebase Firestore** | users, products, orders, reviews, artisan applications | Daily export to GCS (script below) | `gcloud firestore import` |
| **Firebase Storage** | product images, KYC docs, user avatars | [Automatic versioning](https://firebase.google.com/docs/storage/manage-files#manage-object-lifecycles) on the bucket; also mirrored to GCS nightly | Re-upload from GCS |
| **FastAPI SQLite** (Render) | blockchain ledger, knowledge graph cache | Daily `gsutil cp` to GCS | Pull file from GCS onto the Render service |
| **Render** (app + build artifacts) | Next.js + FastAPI source, build cache | Render keeps the latest deploy; older deploys available for 90 days | Redeploy from a known-good commit |

## RPO / RTO targets

- **RPO (data loss tolerance):** 24 hours for Firestore and Storage; 24 hours for SQLite. We run a single daily export, so the worst case is losing the day's writes.
- **RTO (downtime tolerance):** 1 hour for the app. Render's cold start is ~30 s; the FE rebuild + Vercel rollout is ~5 min.

## Scripts

Both live in `scripts/`:

```bash
# Daily Firestore export (run on a schedule from Cloud Scheduler)
./scripts/backup-firestore.sh viraasat-ai gs://viraasat-backups

# Daily SQLite snapshot
./scripts/backup-sqlite.sh gs://viraasat-backups ./viraasat.db
```

Set `FIREBASE_PROJECT_ID` and `BACKUP_BUCKET` in the runner's environment. The runner needs the `roles/datastore.importExportAdmin` IAM role on the project.

## Recommended schedule

| Job | Cadence | Tool |
|---|---|---|
| Firestore export | Daily 02:00 IST | Cloud Scheduler → Cloud Run job |
| Storage mirror | Daily 03:00 IST | Cloud Scheduler → Cloud Run job (`gsutil rsync`) |
| SQLite snapshot | Daily 04:00 IST | Render cron job (`backup-sqlite.sh`) |
| Disaster recovery drill | Quarterly | Manual run-through (see below) |

## Restore procedures

### Restore Firestore from a daily export

> ⚠️ Destructive. This overwrites the live database with the contents of the export. Take a fresh backup before you start.

```bash
# 1. Stop the FE from writing (or rotate Clerk → backend webhook off)
# 2. Confirm the export you want:
gcloud storage ls gs://viraasat-backups/firestore-backups/ --project=viraasat-ai
# 3. Import (this can take minutes to hours)
gcloud firestore import gs://viraasat-backups/firestore-backups/20260902T020000Z \
  --project=viraasat-ai
# 4. Re-enable writes
# 5. Verify with a smoke test
curl https://api.viraasat.ai/health
```

### Restore the FastAPI SQLite database

```bash
# 1. SSH into the Render service or use the Render shell
# 2. Pull the most recent backup
gsutil cp gs://viraasat-backups/sqlite-viraasat.db-20260902T040000Z.db ./viraasat.db
# 3. Restart the service so it reopens the file
# 4. Verify provenance lookups
curl https://api.viraasat.ai/api/blockchain/provenance/PROD-001
```

### Restore Storage objects

```bash
# Mirror from GCS back to the Firebase bucket
gsutil rsync -r \
  gs://viraasat-backups/storage/20260902/ \
  gs://viraasat-ai.firebasestorage.app/
```

### Roll back the application

```bash
# Option A: redeploy a previous commit on Vercel
vercel rollback --yes

# Option B: redeploy on Render
# Use the Render dashboard → service → "Rollback" to a previous deploy.
```

## Quarterly DR drill

1. Spin up a fresh GCP project and Firebase instance.
2. Restore Firestore from the most recent export.
3. Restore the SQLite file to a local FastAPI instance.
4. Run the smoke test script (below) against the restored stack.
5. Compare response times and contents to production. Document any drift.
6. Time the full RTO (from "initiate restore" to "traffic serving").

A runbook template lives at `docs/dr-drill-template.md`. Copy it to
`dr-drill-YYYY-MM-DD.md` at the start of each drill and fill in timings/results.

## What is NOT backed up

- **Render ephemeral disk**: anything written outside the SQLite file path. Do not let the FastAPI service write logs or temp files to `/tmp` if you need to keep them.
- **Live chat transcripts**: not stored (rate-limited in-memory only).
- **Sentry events**: kept by Sentry for 90 days on the default plan; upgrade if you need longer.

## Contacts

- Primary on-call: <oncall@viraasat.ai>
- GCP / Firebase escalation: <ops@viraasat.ai>
- Status page: <https://status.viraasat.ai>
