# Security Policy

## Supported Versions

| Version / Branch | Supported |
|---|---|
| `main` (latest) | ✅ Active |
| Older branches | ❌ No patches |

Only the `main` branch receives security fixes. Please make sure you are testing against the latest commit before filing a report.

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**  
Disclosing a vulnerability publicly before a fix is available puts all users at risk.

### How to report

1. **Email:** Send a detailed report to **aayushkumarsingh.dev@gmail.com**  
   Subject line: `[SECURITY] Viraasat – <short description>`

2. **Include in your report:**
   - A clear description of the vulnerability and its potential impact
   - Step-by-step reproduction instructions (or a proof-of-concept)
   - Affected component(s): frontend, backend, Firebase rules, CI, etc.
   - Any suggested mitigations or fixes (optional but appreciated)

3. **Response timeline:**
   | Step | Target time |
   |---|---|
   | Acknowledgement | Within **48 hours** |
   | Initial assessment | Within **5 business days** |
   | Fix or mitigation | Within **30 days** for critical; **90 days** for lower severity |
   | Public disclosure | After fix is deployed and users have had time to update |

4. We will keep you informed throughout the process and credit you in the release notes unless you prefer to remain anonymous.

---

## Scope

The following are **in scope**:

- Authentication & authorisation bypasses (Clerk session, Firebase rules, backend JWT)
- Payment flow vulnerabilities (Razorpay webhook HMAC verification, order tampering)
- Secrets or credentials exposed via API responses, logs, or public files
- CSRF, SSRF, SQL/NoSQL injection, XSS in the Next.js frontend or FastAPI backend
- Insecure direct object references (IDOR) on products, orders, or user data
- Firestore / Storage security rule bypasses

The following are **out of scope**:

- Denial-of-service attacks against the public demo deployment
- Vulnerabilities in third-party services (Clerk, Firebase, Razorpay, Vercel, Render) — report these directly to the vendor
- Social engineering or phishing attacks
- Issues requiring physical access to a device

---

## Known Security Hardening Already in Place

- Clerk session JWTs verified on every protected API route (frontend and backend)
- Razorpay webhooks verify HMAC-SHA256 signatures before processing
- Clerk webhooks verified with `svix` signature verification
- Firebase Firestore and Storage rules enforce per-user and per-role access
- All secrets sourced from environment variables — never hardcoded
- `REQUIRE_AUTH=true` enforced in all production deployments
- `ALLOWED_ORIGINS` locked to known domains in production
- `slowapi` rate limiting on all public FastAPI endpoints
- CI pipeline scans for leaked credentials (Clerk `pk_live_`/`sk_live_` patterns)
- Sentry captures errors without logging raw request bodies or PII

---

## Responsible Disclosure Policy

We follow a coordinated responsible disclosure model. We ask that you:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Avoid accessing, modifying, or deleting data that does not belong to you
- Do not disrupt the live service or other users' sessions during testing

In return, we commit to:

- Responding promptly and keeping you informed
- Not pursuing legal action against researchers acting in good faith
- Crediting you publicly (with your permission) once the fix is shipped

---

*This policy was last updated: January 2026*
