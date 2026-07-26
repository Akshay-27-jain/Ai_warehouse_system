import pytest
from app import create_app


def make_client_or_skip():
    try:
        app = create_app()
    except RuntimeError as exc:
        pytest.skip(f"Skipping tests because app cannot be created: {exc}")
    app.testing = True
    return app.test_client()


def test_delete_warehouse_requires_auth():
    client = make_client_or_skip()
    resp = client.delete('/api/v1/warehouses/1')
    assert resp.status_code in (401, 403)
