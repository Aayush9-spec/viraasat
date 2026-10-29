import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.mark.parametrize('path', ['/api/create-order', '/api/razorpay/order', '/api/verify-payment', '/api/razorpay/verify'])
def test_legacy_payment_endpoints_cannot_bypass_durable_checkout(path):
    with TestClient(app) as client:
        response = client.post(path, json={'amount': 100, 'order_id': 'order_mock_attacker', 'payment_id': 'anything', 'signature': 'anything'})
        assert response.status_code == 410
        assert 'verified' not in response.json()
