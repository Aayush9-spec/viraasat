# Contributing to Viraasat

Thank you for taking the time to contribute! 🪔  
This document covers everything you need to get a change from idea to merged PR.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Branch & Commit Conventions](#branch--commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Security Issues](#security-issues)

---

## Code of Conduct

By participating in this project you agree to be respectful, constructive, and inclusive.  
Harassment or discriminatory behaviour of any kind will not be tolerated.

---

## How Can I Contribute?

| Type | How to start |
|---|---|
| 🐛 Bug fix | Open a [Bug Report issue](https://github.com/Aayush9-spec/viraasat/issues/new?template=bug_report.md) first, then open a PR referencing it |
| ✨ New feature | Open a [Feature Request issue](https://github.com/Aayush9-spec/viraasat/issues/new?template=feature_request.md) to discuss scope before building |
| 📖 Documentation | PRs welcome directly — no issue needed for typo fixes or clarity improvements |
| 🌍 Translation | Open an issue labelled `i18n` and propose the locale |
| 🔒 Vulnerability | **Do not** open a public issue — follow the process in [`SECURITY.md`](SECURITY.md) |

---

## Development Setup

```bash
# Fork & clone
git clone https://github.com/<YOUR_USERNAME>/viraasat.git
cd viraasat

# Frontend
cd frontend
cp .env.example .env.local   # fill in test credentials
npm install --legacy-peer-deps
cd ..

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env         # fill in test credentials
cd ..

# Run both
./run_all_viraasat.sh
# Frontend → http://localhost:9002
# Backend  → http://localhost:8000/docs
```

---

## Branch & Commit Conventions

### Branch naming

```
feat/<short-description>      # new feature
fix/<short-description>       # bug fix
chore/<short-description>     # tooling / deps / config
docs/<short-description>      # documentation only
refactor/<short-description>  # internal restructure (no behaviour change)
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary in present tense>

[optional body]

[optional footer: Closes #123]
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore`  
**Scopes (examples):** `frontend` · `backend` · `firebase` · `ai` · `payments` · `pwa`

---

## Pull Request Process

1. **Keep PRs focused** — one logical change per PR. Large PRs take longer to review and are harder to revert.
2. **Fill in the PR template** — every checkbox matters.
3. **Link the issue** — use `Closes #<issue>` in the PR description.
4. **Pass CI** — all GitHub Actions checks must be green before a review is requested.
5. **No secrets** — the CI pipeline scans for leaked keys. Any PR that introduces a real key will be rejected immediately.
6. **Request a review** from `@Aayush9-spec` or a project maintainer.
7. PRs are merged by squash-merge to keep `main` history clean.

---

## Coding Standards

### TypeScript / Frontend

- **Strict TypeScript** — no `any` unless absolutely necessary (add a comment explaining why).
- **Tailwind for styling** — avoid inline `style` props; use utility classes or `cn()`.
- **Radix UI primitives** for accessible interactive components.
- Keep components small and single-purpose. Logic > 50 lines belongs in a hook or utility.
- All API routes in `src/app/api/` must verify the Clerk session before touching data.

### Python / Backend

- **Type hints everywhere** — functions must have parameter and return annotations.
- **FastAPI dependency injection** for auth (`get_current_user`), storage, and config.
- Route handlers stay thin — business logic lives in `app/services/` or `ai/`.
- `slowapi` rate-limit decorators are required on every public endpoint.
- Do not import `sqlite3` directly in route handlers — use the storage abstraction layer.

### General

- No commented-out code in merged PRs.
- No `console.log` / `print` debug statements — use the existing logger/Sentry utilities.
- Environment variables are never hardcoded — always sourced from `process.env` / `os.environ`.

---

## Testing Requirements

| Area | Requirement |
|---|---|
| New frontend feature | Add a Jest unit test in `frontend/src/app/__tests__/` or a co-located `*.test.tsx` |
| New backend endpoint | Add a `pytest` test in `backend/tests/` using the in-memory store fixture |
| Bug fix | Add a regression test that fails before your fix and passes after |
| UI component | Ensure it passes the existing Playwright accessibility scan (no new a11y violations) |

Run all checks before pushing:

```bash
# Frontend
cd frontend
npm run lint && npm run typecheck && npm run test:unit

# Backend
cd ../backend
source venv/bin/activate && python -m pytest -v
```

---

## Security Issues

**Do not open a public GitHub issue for security vulnerabilities.**  
Please follow the responsible disclosure process described in [`SECURITY.md`](SECURITY.md).

---

Thank you for helping preserve India's heritage — one commit at a time. 🙏
