# Production Secrets

> ⚠️ **All keys in this repo's `frontend/.env.local` were leaked and have been deleted.** If you forked or cloned this repo before that, **rotate every key** in Clerk, Firebase, Google AI Studio, and Razorpay before continuing.

## Where secrets live in production

| Service   | Manager      | Where to set                              |
|-----------|--------------|-------------------------------------------|
| Frontend  | Vercel       | Project → Settings → Environment Variables |
| Backend   | Render       | Service → Environment → Environment Variables |

Never commit `.env` or `.env.local` files. Both are gitignored. Use `*.example` files as templates.

## Setup checklist

### 1. Clerk (auth)
- Create application at <https://dashboard.clerk.com>
- Enable Email/Password and any social providers
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in **both** Vercel and Render
- Add `https://YOUR_VERCEL_DOMAIN.vercel.app` to allowed origins
- Copy the JWT signing key (`CLERK_JWT_KEY`) into Render for backend verification

### 2. Firebase
- Create project at <https://console.firebase.google.com>
- Enable Authentication, Firestore, Storage
- Generate a service account JSON (Project Settings → Service Accounts) and base64-encode it:
  ```bash
  cat service-account.json | base64 -w 0
  ```
  Paste the result as `FIREBASE_SERVICE_ACCOUNT_JSON` in Render
- Add the matching web config values to Vercel (`NEXT_PUBLIC_FIREBASE_*`)

### 3. Google AI (Gemini)
- Create an API key at <https://aistudio.google.com/apikey>
- Set `GEMINI_API_KEY` in Vercel

### 4. Razorpay
- Generate test/live keys at <https://dashboard.razorpay.com/app/keys>
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (publishable) in Vercel

### 5. Sentry (optional but recommended)
- Create a project at <https://sentry.io>
- Set `SENTRY_DSN` in both Vercel and Render

## Local development

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# fill in test values
cd frontend && npm run dev

# Backend
cp backend/.env.example backend/.env
# fill in test values
cd backend && source venv/bin/activate
PYTHONPATH=backend uvicorn main:app --reload --port 8000
```

## If a key is leaked

1. Revoke / rotate the key in the source console (Clerk, Firebase, Google, Razorpay)
2. Update the value in Vercel and Render
3. Redeploy both services
4. Audit logs in each provider for misuse
