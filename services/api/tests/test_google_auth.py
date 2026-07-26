import importlib
import os

import pytest

from app import create_app
from app.extensions import db
from app.models.user import User
from app.services import auth_service as auth_service_module


@pytest.fixture
def app_context():
    try:
        app = create_app()
    except RuntimeError as exc:
        pytest.skip(f"Skipping Google auth tests because app cannot be created: {exc}")
    app.testing = True
    with app.app_context():
        yield app


def test_google_auth_creates_user_and_returns_tokens(app_context, monkeypatch):
    class DummyResponse:
        def __init__(self, payload, status_code=200):
            self._payload = payload
            self.status_code = status_code

        def json(self):
            return self._payload

    def fake_post(url, data=None, headers=None, timeout=10):
        assert url.endswith('/token')
        return DummyResponse({'access_token': 'google-access-token', 'refresh_token': 'google-refresh-token'})

    def fake_get(url, headers=None, timeout=10):
        assert url.endswith('/userinfo')
        return DummyResponse({'sub': 'google-user-1', 'email': 'google-user@example.com', 'given_name': 'Google', 'family_name': 'User', 'picture': 'https://example.com/avatar.png'})

    monkeypatch.setattr(auth_service_module.requests, 'post', fake_post)
    monkeypatch.setattr(auth_service_module.requests, 'get', fake_get)

    auth_service = auth_service_module.AuthService()
    result = auth_service.handle_google_callback('sample-code')

    assert result['access_token']
    assert result['refresh_token']
    assert result['user']['email'] == 'google-user@example.com'

    user = User.query.filter_by(email='google-user@example.com').first()
    assert user is not None
    assert user.email_verified is True


def test_google_oauth_uses_google_env_names_when_present(monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'google-client-id')
    monkeypatch.setenv('GOOGLE_CLIENT_SECRET', 'google-client-secret')
    monkeypatch.setenv('GOOGLE_REDIRECT_URI', 'https://example.com/callback')

    import app.config.settings as settings_module
    importlib.reload(settings_module)

    assert settings_module.settings.GOOGLE_CLIENT_ID == 'google-client-id'
    assert settings_module.settings.GOOGLE_CLIENT_SECRET == 'google-client-secret'
    assert settings_module.settings.GOOGLE_REDIRECT_URI == 'https://example.com/callback'
