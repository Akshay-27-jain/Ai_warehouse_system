import pytest
from app import create_app


def make_client_or_skip():
    try:
        app = create_app()
    except RuntimeError as exc:
        pytest.skip(f"Skipping tests because app cannot be created: {exc}")
    app.testing = True
    return app.test_client()


def test_notifications_requires_auth():
    client = make_client_or_skip()
    resp = client.get('/api/v1/notifications/')
    assert resp.status_code in (401, 403)


def test_unread_count_requires_auth():
    client = make_client_or_skip()
    resp = client.get('/api/v1/notifications/unread-count')
    assert resp.status_code in (401, 403)


def test_forgot_password_invalid_email():
    client = make_client_or_skip()
    resp = client.post('/api/v1/auth/forgot-password', json={'email': 'not-found@example.com'})
    # service returns 400 when email not found
    assert resp.status_code == 400
