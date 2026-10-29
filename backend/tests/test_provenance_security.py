import copy
import uuid
import pytest
from ai.blockchain import get_or_create_ledger, get_existing_ledger, is_chain_valid, perform_transfer_ownership
from app.services.storage import MemoryStore, SQLiteStore


def test_registration_does_not_invent_certifications():
    chain = get_or_create_ledger(str(uuid.uuid4()), 'user_owner')
    assert len(chain) == 1
    assert 'not verified' in chain[0]['action']
    assert is_chain_valid(chain)
    altered = copy.deepcopy(chain)
    altered[0]['actor'] = 'user_attacker'
    assert not is_chain_valid(altered)
    assert not is_chain_valid([])


def test_only_current_custodian_can_transfer():
    product = str(uuid.uuid4())
    get_or_create_ledger(product, 'user_owner')
    with pytest.raises(PermissionError):
        perform_transfer_ownership(product, 'user_thief', 1, caller_id='user_attacker')
    assert len(get_existing_ledger(product)) == 1
    perform_transfer_ownership(product, 'user_buyer', 1, caller_id='user_owner')
    with pytest.raises(PermissionError):
        perform_transfer_ownership(product, 'user_thief', 1, caller_id='user_owner')
    assert is_chain_valid(get_existing_ledger(product))


@pytest.mark.parametrize('backend', ['memory', 'sqlite'])
def test_duplicate_block_cannot_overwrite_history(tmp_path, backend):
    store = MemoryStore() if backend == 'memory' else SQLiteStore(str(tmp_path / 'ledger.db'))
    block = {'index': 1, 'actor': 'user_owner'}
    store.append_ledger_block('p', block)
    with pytest.raises(Exception):
        store.append_ledger_block('p', {'index': 1, 'actor': 'user_thief'})
    assert store.get_ledger('p')[0]['actor'] == 'user_owner'


def test_transfer_route_enforces_owner_identity():
    from fastapi.testclient import TestClient
    from main import app
    from app.api.deps import get_current_user
    product = str(uuid.uuid4())
    get_or_create_ledger(product, 'user_owner')
    app.dependency_overrides[get_current_user] = lambda: {'userId': 'user_intruder', 'role': 'buyer'}
    try:
        with TestClient(app) as client:
            response = client.post('/api/blockchain/transfer', json={'product_id': product, 'new_owner': 'user_recipient', 'tx_value': 10})
            assert response.status_code == 403
            assert len(get_existing_ledger(product)) == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)
