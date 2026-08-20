from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from datetime import datetime

app = FastAPI(
    title="Viraasat Platform API Gateway",
    description="Python API Services for Indian Handicrafts Platform: ML, Knowledge Graphs, Blockchain, and Fraud Analytics."
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoint routers
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "status": "operational",
        "service": "Viraasat AI Platform API Gateway",
        "timestamp": datetime.now().isoformat()
    }
