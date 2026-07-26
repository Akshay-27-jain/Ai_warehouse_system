import os
import pytest
from app import create_app
from app.extensions import db
from app.models.email import PasswordResetToken
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.email_service import EmailService


@pytest.fixture
def app_context():
    try:
        app = create_app()
    except RuntimeError as exc:
        pytest.skip(f"Skipping email tests because app cannot be created: {exc}")
    app.testing = True
    with app.app_context():
        yield app


def test_forgot_password_creates_hashed_reset_token(app_context):
    with app_context.app_context():
        user = User.query.filter_by(email='email-test@example.com').first()
        if not user:
            user = User(username='emailtest', email='email-test@example.com', first_name='Email', last_name='Test')
            user.set_password('Abcd1234!')
            db.session.add(user)
            db.session.commit()

        auth_service = AuthService()
        result = auth_service.forgot_password('email-test@example.com')

        token_record = PasswordResetToken.query.filter_by(user_id=user.id).order_by(PasswordResetToken.created_at.desc()).first()
        assert token_record is not None
        assert token_record.token_hash != result['reset_token']
        assert token_record.is_active is True


def test_reset_password_invalidates_existing_token(app_context):
    with app_context.app_context():
        user = User.query.filter_by(email='email-reset@example.com').first()
        if not user:
            user = User(username='emailreset', email='email-reset@example.com', first_name='Reset', last_name='User')
            user.set_password('Abcd1234!')
            db.session.add(user)
            db.session.commit()

        auth_service = AuthService()
        result = auth_service.forgot_password('email-reset@example.com')
        reset_response = auth_service.reset_password(result['reset_token'], 'NewPassword123!')

        token_record = PasswordResetToken.query.filter_by(user_id=user.id).order_by(PasswordResetToken.created_at.desc()).first()
        assert reset_response['password_reset'] is True
        assert token_record is not None
        assert token_record.is_active is False
        assert token_record.used_at is not None


def test_email_service_reports_invalid_configuration():
    original_mail_server = os.environ.pop('MAIL_SERVER', None)
    original_mail_username = os.environ.pop('MAIL_USERNAME', None)
    original_mail_password = os.environ.pop('MAIL_PASSWORD', None)
    original_gmail_client_id = os.environ.pop('GMAIL_CLIENT_ID', None)
    original_gmail_client_secret = os.environ.pop('GMAIL_CLIENT_SECRET', None)
    original_gmail_refresh_token = os.environ.pop('GMAIL_REFRESH_TOKEN', None)
    try:
        service = EmailService()
        result = service.validate_configuration()
        assert result['valid'] is False
    finally:
        if original_mail_server is not None:
            os.environ['MAIL_SERVER'] = original_mail_server
        if original_mail_username is not None:
            os.environ['MAIL_USERNAME'] = original_mail_username
        if original_mail_password is not None:
            os.environ['MAIL_PASSWORD'] = original_mail_password
        if original_gmail_client_id is not None:
            os.environ['GMAIL_CLIENT_ID'] = original_gmail_client_id
        if original_gmail_client_secret is not None:
            os.environ['GMAIL_CLIENT_SECRET'] = original_gmail_client_secret
        if original_gmail_refresh_token is not None:
            os.environ['GMAIL_REFRESH_TOKEN'] = original_gmail_refresh_token
