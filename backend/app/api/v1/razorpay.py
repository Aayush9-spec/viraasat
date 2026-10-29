"""Retired amount-only payment endpoints; web checkout owns durable orders."""
from fastapi import APIRouter, HTTPException
router = APIRouter()

@router.post('/create-order')
@router.post('/razorpay/order')
@router.post('/verify-payment')
@router.post('/razorpay/verify')
async def retired_payment_endpoint():
    raise HTTPException(410, 'Use the authenticated website checkout API with product IDs and shipping details')
