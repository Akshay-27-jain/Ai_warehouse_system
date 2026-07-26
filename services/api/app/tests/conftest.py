"""
Pytest configuration and test fixtures for Flask API testing.
"""
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, Role, UserRole


@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        'TESTING': True,
        'RATELIMIT_ENABLED': False,
        'WTF_CSRF_ENABLED': False,
    })
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


@pytest.fixture
def admin_token(client, app):
    with app.app_context():
        # Retrieve or seed admin user
        user = User.query.filter_by(username='admin').first()
        if user:
            res = client.post('/api/v1/auth/login', json={
                'username': 'admin',
                'password': 'Admin@12345'
            })
            if res.status_code == 200 and 'data' in res.json:
                return res.json['data'].get('token') or res.json['data'].get('access_token')
    return None
