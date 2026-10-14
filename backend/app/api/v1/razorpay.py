import hmac
import hashlib
import os
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import razorpay

router = APIRouter()


class CreateOrderInput(BaseModel):
    amount: int = Field(..., description="Amount in paise (minimum 100)")
    currency: Optional[str] = "INR"
    receipt: Optional[str] = None


class VerifyPaymentInput(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    signature: Optional[str] = None


@router.post("/create-order")
async def create_order(payload: CreateOrderInput):
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay API keys not configured",
        )

    if payload.amount < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be at least 100 paise",
        )

    receipt = payload.receipt or f"rcpt_{int(time.time())}"

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        data = {
            "amount": payload.amount,
            "currency": (payload.currency or "INR").upper(),
            "receipt": receipt,
        }
        order = client.order.create(data=data)
        return {
            "order_id": order["id"],
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "receipt": order["receipt"],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Razorpay API error: {str(e)}",
        )


@router.post("/verify-payment")
async def verify_payment(payload: VerifyPaymentInput):
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay secret key not configured",
        )

    order_id = payload.razorpay_order_id or payload.order_id
    payment_id = payload.razorpay_payment_id or payload.payment_id
    signature = payload.razorpay_signature or payload.signature

    if not order_id or not payment_id or not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: order_id, payment_id, and signature are required",
        )

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    secret = key_secret.encode("utf-8")
    generated_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(generated_signature, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature mismatch. Payment verification failed.",
        )

    return {
        "verified": True,
        "message": "Payment signature verified successfully",
        "order_id": order_id,
        "payment_id": payment_id,
    }
