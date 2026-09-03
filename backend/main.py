import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.router import api_router
from app.api.webhooks import router as webhooks_router

load_dotenv()

# Optional Sentry init. No-op if SENTRY_DSN is unset (e.g. local dev).
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.getenv("ENVIRONMENT", "development"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
    )

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:9002,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

# Per-route limits are applied via @limiter.limit(...) in app/api/router.py.
# No global default so that webhooks (signature-verified, called by Clerk)
# are not throttled.
limiter = Limiter(key_func=get_remote_address, default_limits=[])

app = FastAPI(
    title="Viraasat Platform API Gateway",
    description=(
        "Python API Services for Indian Handicrafts Platform: "
        "ML, Knowledge Graphs, Blockchain, and Fraud Analytics."
    ),
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

app.include_router(api_router, prefix="/api")
# Webhooks are unauthenticated and use signature verification; mount them
# under the same /api prefix without going through the rate limiter.
app.include_router(webhooks_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "status": "operational",
        "service": "Viraasat AI Platform API Gateway",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
