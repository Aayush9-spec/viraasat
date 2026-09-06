# Disaster Recovery Drill — Runbook Template

Copy this file to `dr-drill-YYYY-MM-DD.md` in Google Drive (or the repo if
non-sensitive) at the start of each quarterly drill, and fill in the results.
Time each phase; the RTO target is **1 hour**, RPO is **24 hours**.

## Drill metadata

| Field | Value |
|---|---|
| Drill date | YYYY-MM-DD |
| Facilitator | |
| Participants | |
| Symptom card used | e.g. "Firestore database deleted", "Render SQLite file corrupt" |
| Start time (UTC) | |
| End time (UTC) | |
| Actual RTO | |
| Result | PASS / PARTIAL / FAIL |

## Objective

> Brief description of the scenario being rehearsed (e.g. "restore the platform
> after a total Firestore outage using the most recent daily export").

## Preconditions

- [ ] Fresh GCP project + Firebase instance provisioned (staging, isolated from prod).
- [ ] Most recent Firestore export confirmed present in `gs://viraasat-backups`.
- [ ] Most recent SQLite snapshot confirmed present in `gs://viraasat-backups`.
- [ ] Backend `REQUIRE_AUTH=false` + `DATABASE_URL` pointed at the restored SQLite.
- [ ] FE deployed with `NEXT_PUBLIC_FIREBASE_*` pointing at the staging project.

## Steps & timestamps

| # | Action | Owner | Start | Done | Notes / issues |
|---|---|---|---|---|---|
| 1 | Restore Firestore from export | | | | |
| 2 | Restore SQLite from snapshot | | | | |
| 3 | Re-seed knowledge graph into the store | | | | |
| 4 | Start FastAPI + run smoke tests | | | | |
| 5 | Start FE against restored stack | | | | |
| 6 | Verify buyer flows (shop → product → cart → checkout) | | | | |
| 7 | Verify provenance + AI endpoints | | | | |
| 8 | Verify admin moderation queue | | | | |

## Smoke tests

```bash
curl -fsS https://<staging-host>/health
curl -fsS "https://<staging-host>/api/forecast-demand?region=Rajasthan&category=Textiles"
curl -fsS "https://<staging-host>/api/search/semantic?q=blue%20pottery"
curl -fsS "https://<staging-host>/api/knowledge-graph/search?query=Pashmina"
# Auth-gated (returns 401 without a token):
curl -s -o /dev/null -w "%{http_code}\n" "https://<staging-host>/api/blockchain/provenance/PROD-001"
```

Also run the automated suites as a regression gate:
- Frontend: `cd frontend && npm run test:unit && npm run typecheck && npm run lint`
- Backend:  `cd backend && venv/bin/python -m pytest`

## Human approval gates

- [ ] Backups verified **before** restore (list the export IDs used).
- [ ] Staging writes re-enabled only after data verification.
- [ ] Provenance authenticity score still returns ≥ expected on a sample product.
- [ ] No customer-facing regressions seen in the restored data.

## Debrief

### What went well

### What failed / was slow

### Corrective actions

| Action | Owner | Due |
|---|---|---|
| | | |

## Sign-off

- Facilitator: ________________
- Engineering owner: ________________
- Ops owner: ________________

## Helpers

- Firestore export listing: `gcloud storage ls gs://viraasat-backups/firestore-backups/ --project=viraasat-ai`
- SQLite snapshot listing: `gsutil ls gs://viraasat-backups/sqlite-*`
- Backups scripts: `scripts/backup-firestore.sh`, `scripts/backup-sqlite.sh` (see `docs/disaster-recovery.md`)
- On-call: <oncall@viraasat.ai> &nbsp;·&nbsp; GCP/Firebase: <ops@viraasat.ai> &nbsp;·&nbsp; Status: <https://status.viraasat.ai>