# Live Deployment Guide

Follow this guide to deploy the Viraasat platform to production servers.

---

## 🌐 Frontend: Next.js (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure Environment Variables in the project dashboard:
   *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   *   `CLERK_SECRET_KEY`
   *   `GEMINI_API_KEY`
   *   `NEXT_PUBLIC_FIREBASE_API_KEY`
   *   `NEXT_PUBLIC_BACKEND_URL` (points to the live FastAPI URL from step 2).
3. Deploy the application.

---

## 🐍 Backend: FastAPI (Render)

1. Connect the repository to [Render](https://render.com) as a **Web Service**.
2. Configure settings:
   *   **Root Directory**: `backend`
   *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Deploy the backend service.
