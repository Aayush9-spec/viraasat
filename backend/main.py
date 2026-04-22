import os
import json
import razorpay
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="VIRAASAT Heritage API", description="Python-based E-commerce Engine for VIRAASAT")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to ["http://localhost:9002"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_1234567890")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "PLACEHOLDER_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Models
class Product(BaseModel):
    id: str
    name: str
    price: float
    category: str
    region: str
    description: str

class OrderRequest(BaseModel):
    amount: float
    currency: str = "INR"

class OrderResponse(BaseModel):
    id: str
    amount: int
    currency: str

# Endpoints
@app.get("/")
async def root():
    return {"message": "VIRAASAT Python Backend is live", "status": "operational"}

@app.get("/api/products", response_model=List[Product])
async def get_products():
    try:
        with open("backend/data/products.json", "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/razorpay/order", response_model=OrderResponse)
async def create_razorpay_order(request: OrderRequest):
    try:
        # Amount in paise (multiply by 100)
        amount_paise = int(request.amount * 100)
        
        data = {
            "amount": amount_paise,
            "currency": request.currency,
            "receipt": "receipt_order_74394",
        }
        
        order = client.order.create(data=data)
        return {
            "id": order['id'],
            "amount": order['amount'],
            "currency": order['currency']
        }
    except Exception as e:
        print(f"Razorpay Error: {e}")
        # In a test environment, return a mock order if the real one fails
        return {
            "id": f"order_mock_{os.urandom(4).hex()}",
            "amount": int(request.amount * 100),
            "currency": request.currency
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
