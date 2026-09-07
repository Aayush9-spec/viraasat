import hmac
import hashlib
import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_order_min_amount_validation():
    # Amount less than 100 paise should fail validation with status 400
    response = client.post("/api/create-order", json={"amount": 50, "currency": "INR"})
    assert response.status_code == 400
    assert "at least 100 paise" in response.json()["detail"]

def test_verify_payment_missing_fields():
    # Missing required fields should return 400
    response = client.post("/api/verify-payment", json={"order_id": "order_123"})
    assert response.status_code == 400
    assert "Missing required fields" in response.json()["detail"]

def test_verify_payment_invalid_signature():
    # Invalid signature should return 400
    response = client.post("/api/verify-payment", json={
        "order_id": "order_123456",
        "payment_id": "pay_123456",
        "signature": "invalid_signature_hash"
    })
    assert response.status_code == 400
    assert "Signature mismatch" in response.json()["detail"]

def test_verify_payment_valid_signature():
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "AGxzrZj2IpfG0qxWNrX7KEfu")
    order_id = "order_test_999"
    payment_id = "pay_test_999"
    
    body_to_sign = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(key_secret.encode("utf-8"), body_to_sign, hashlib.sha256).hexdigest()
    
    response = client.post("/api/verify-payment", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": expected_signature
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is True
    assert data["order_id"] == order_id
    assert data["payment_id"] == payment_id
