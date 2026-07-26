import os
import pytest
from app import create_app


@pytest.fixture(scope='session')
def app():
    os.environ.setdefault('FLASK_ENV', 'testing')
    os.environ.setdefault('SECRET_KEY', 'test-secret-key')
    os.environ.setdefault('JWT_SECRET_KEY', 'test-jwt-secret')
    os.environ.setdefault('CORS_ORIGINS', 'http://localhost:3000')
    application = create_app()
    with application.app_context():
        from app.extensions import db
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(app, client):
    from app.extensions import db
    from app.models.user import User, Role
    from flask_jwt_extended import create_access_token

    with app.app_context():
        role = Role.query.filter_by(name='Admin').first()
        if not role:
            role = Role(name='Admin', description='Admin role')
            db.session.add(role)
            db.session.commit()

        user = User.query.filter_by(username='testuser').first()
        if not user:
            user = User(
                username='testuser',
                email='test@example.com',
                first_name='Test',
                last_name='User',
                is_active=True,
            )
            user.set_password('TestPass123!')
            db.session.add(user)
            db.session.commit()

        if role not in user.roles:
            user.roles.append(role)
            db.session.commit()

        token = create_access_token(identity=str(user.id))
        return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
