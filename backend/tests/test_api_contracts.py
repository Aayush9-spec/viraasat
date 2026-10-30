from fastapi.testclient import TestClient
from main import app

def test_evaluation_does_not_fabricate_vision_or_latency_metrics():
    with TestClient(app) as client:
        response=client.get('/api/metrics/evaluation')
    assert response.status_code == 200
    data=response.json()
    assert data['computer_vision']['accuracy'] is None
    assert data['system_telemetry']['total_uptime'] is None
    assert data['system_telemetry']['is_measured'] is False

def test_review_input_rejects_out_of_range_rating():
    with TestClient(app) as client:
        response=client.post('/api/fraud/detect',json={'seller_id':'seller','reviewer_id':'user_buyer','rating':99,'review_text':'A complete review'})
    assert response.status_code == 422

def test_user_controlled_metadata_cannot_assign_privileged_role():
    from app.api.v1.webhooks import _extract_user_data
    assert _extract_user_data({'id':'user_test','unsafe_metadata':{'role':'admin'}})['role'] == 'customer'
    assert _extract_user_data({'id':'user_test','public_metadata':{'role':'artisan'},'unsafe_metadata':{'role':'admin'}})['role'] == 'artisan'
