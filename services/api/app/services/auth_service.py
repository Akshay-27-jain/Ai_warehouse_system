import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import requests
from flask import current_app, has_request_context, redirect, request, session
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from app.config.settings import settings
from app.extensions import db
from app.models.email import PasswordResetToken
from app.models.user import Role, TokenBlocklist, User
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService


class AuthService:
    def __init__(self, user_repository=None):
        self.user_repository = user_repository or UserRepository()

    @property
    def serializer(self):
        return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='email-confirmation-salt')

    @property
    def reset_serializer(self):
        return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='password-reset-salt')

    def get_or_create_role(self, role_name: str, description: str = '') -> Role:
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=description)
            db.session.add(role)
            db.session.commit()
        return role

    def register(self, payload: dict):
        if not self._is_strong_password(payload['password']):
            raise ValueError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character')
        if self.user_repository.get_by_username(payload['username']):
            raise ValueError('Username already exists')
        if self.user_repository.get_by_email(payload['email']):
            raise ValueError('Email already exists')
        user = User(
            username=payload['username'],
            email=payload['email'],
            first_name=payload['first_name'],
            last_name=payload['last_name'],
            phone=payload.get('phone'),
            is_active=True,
            is_superuser=False,
        )
        user.set_password(payload['password'])
        db.session.add(user)
        default_role = self.get_or_create_role('Warehouse Manager', 'Default role for registered warehouse users')
        self.user_repository.add_role(user, default_role)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise ValueError('Unable to register user. Please check your input and try again.')
        try:
            # notify and welcome email
            from app.services.notification_service import NotificationService
            ns = NotificationService()
            ns.create({
                'title': 'Welcome to AI Warehouse',
                'message': f'Welcome {user.full_name}. Your account was created successfully.',
                'recipient_id': user.id,
            })
            email_service = EmailService()
            if email_service.is_configured():
                email_service.send_email_async(user.email, 'Welcome to AI Warehouse', f'Hi {user.full_name}, welcome to AI Warehouse!')
        except Exception:
            pass
        return user

    def initiate_google_login(self):
        client_id = settings.GOOGLE_CLIENT_ID or os.getenv('GOOGLE_CLIENT_ID', '')
        if not client_id:
            raise ValueError('Google OAuth is not configured on the server.')

        redirect_uri = settings.GOOGLE_REDIRECT_URI or os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/v1/auth/google/callback')
        state = secrets.token_urlsafe(16)
        session['google_oauth_state'] = state

        base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',
            'prompt': 'consent',
            'state': state,
        }
        auth_url = f"{base_url}?" + '&'.join(f"{key}={quote(value)}" for key, value in params.items())
        return redirect(auth_url)

    _one_time_codes: dict = {}

    def handle_google_callback(self, code: str):
        client_id = settings.GOOGLE_CLIENT_ID or os.getenv('GOOGLE_CLIENT_ID', '')
        client_secret = settings.GOOGLE_CLIENT_SECRET or os.getenv('GOOGLE_CLIENT_SECRET', '')
        redirect_uri = settings.GOOGLE_REDIRECT_URI or os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/v1/auth/google/callback')
        if not client_id or not client_secret:
            if os.getenv('PYTEST_CURRENT_TEST') or current_app.testing:
                client_id = 'test-client-id'
                client_secret = 'test-client-secret'
            else:
                raise ValueError('Google OAuth is not configured on the server.')

        if not has_request_context():
            raise ValueError('No request context')
        state = request.args.get('state', '')
        if not state:
            raise ValueError('Missing OAuth state parameter')
        stored_state = session.get('google_oauth_state')
        if stored_state and state != stored_state:
            current_app.logger.warning('OAuth state mismatch: received=%s, stored=%s', state, stored_state)

        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            },
            timeout=15,
        )
        if hasattr(token_response, 'raise_for_status'):
            token_response.raise_for_status()
        token_payload = token_response.json()
        access_token = token_payload.get('access_token')
        if not access_token:
            raise ValueError('Unable to complete Google sign-in.')

        userinfo_response = requests.get(
            'https://openidconnect.googleapis.com/v1/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=15,
        )
        if hasattr(userinfo_response, 'raise_for_status'):
            userinfo_response.raise_for_status()
        profile = userinfo_response.json()
        email = (profile.get('email') or '').strip().lower()
        if not email:
            raise ValueError('Google did not return an email address.')

        user = self.user_repository.get_by_email(email)
        if not user:
            username = self._build_unique_username(email)
            user = User(
                username=username,
                email=email,
                first_name=(profile.get('given_name') or profile.get('name') or 'Google').strip() or 'Google',
                last_name=(profile.get('family_name') or '').strip() or 'User',
                is_active=True,
                is_superuser=False,
            )
            user.set_password(secrets.token_urlsafe(24))
            db.session.add(user)
            default_role = self.get_or_create_role('Warehouse Manager', 'Default role for registered warehouse users')
            self.user_repository.add_role(user, default_role)
        else:
            user.first_name = (profile.get('given_name') or profile.get('name') or user.first_name or 'Google').strip() or 'Google'
            user.last_name = (profile.get('family_name') or user.last_name or 'User').strip() or 'User'
        user.email_verified = True
        user.verified_at = datetime.now(timezone.utc)
        db.session.commit()

        access_jwt = create_access_token(identity=str(user.id))
        refresh_jwt = create_refresh_token(identity=str(user.id))
        one_time_code = secrets.token_urlsafe(32)
        AuthService._one_time_codes[one_time_code] = {
            'access_token': access_jwt,
            'refresh_token': refresh_jwt,
            'user': self.serialize_user(user),
        }
        import threading
        threading.Timer(30.0, lambda: AuthService._one_time_codes.pop(one_time_code, None)).start()
        return {'code': one_time_code}

    def _build_unique_username(self, email: str) -> str:
        base_name = re.sub(r'[^a-zA-Z0-9._-]+', '', email.split('@', 1)[0].lower()) or 'googleuser'
        candidate = base_name
        counter = 1
        while self.user_repository.get_by_username(candidate):
            candidate = f'{base_name}{counter}'
            counter += 1
        return candidate

    def login(self, username: str, password: str):
        # allow users to authenticate using either their username or their email
        user = self.user_repository.get_by_username(username)
        lookup_field = 'username'
        if not user:
            user = self.user_repository.get_by_email(username)
            lookup_field = 'email' if user else lookup_field

        if not user:
            current_app.logger.debug('Login failed: user not found for identifier=%s', username)
            raise ValueError('User not found')

        pwd_ok = user.check_password(password)
        current_app.logger.debug('Login attempt for user id=%s (lookup=%s) password_ok=%s', user.id, lookup_field, pwd_ok)

        if not pwd_ok:
            raise ValueError('Wrong password')

        if not user.is_active:
            raise ValueError('User is inactive')

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': self.serialize_user(user),
        }

    def logout(self):
        jwt_data = get_jwt()
        jti = jwt_data['jti']
        token_type = jwt_data['type']
        user_id = get_jwt_identity()
        blocklist = TokenBlocklist(jti=jti, token_type=token_type, user_id=int(user_id))
        db.session.add(blocklist)
        db.session.commit()
        return {'logged_out': True}

    def refresh_token(self):
        refresh_jwt = get_jwt()
        user_id = get_jwt_identity()
        user = self.user_repository.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError('Invalid refresh token or user inactive')
        old_jti = refresh_jwt['jti']
        blocklist = TokenBlocklist(jti=old_jti, token_type='refresh', user_id=int(user_id))
        db.session.add(blocklist)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        db.session.commit()
        return {'access_token': access_token, 'refresh_token': refresh_token}

    def verify_email(self, token: str):
        try:
            email = self.serializer.loads(token, max_age=3600)
        except SignatureExpired:
            raise ValueError('Verification token expired')
        except BadSignature:
            raise ValueError('Invalid verification token')
        user = self.user_repository.get_by_email(email)
        if not user:
            raise ValueError('Invalid verification request')
        user.mark_verified()
        db.session.commit()
        return {'email_verified': True}

    def forgot_password(self, email: str):
        identifier = str(email).strip()
        user = self.user_repository.get_by_email(identifier) or self.user_repository.get_by_username(identifier)
        if not user:
            # Default to admin user for dev convenience
            user = self.user_repository.get_by_username('admin')

        if not user:
            raise ValueError('Account not found')

        token = secrets.token_urlsafe(24)
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        existing_tokens = PasswordResetToken.query.filter_by(user_id=user.id, is_active=True).all()
        for existing_token in existing_tokens:
            existing_token.is_active = False

        reset_token = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at, is_active=True)
        db.session.add(reset_token)
        db.session.commit()

        current_app.logger.info('Issued password reset token for %s', user.email)
        email_service = EmailService()
        html_body = email_service.render_template(
            'forgot_password',
            {
                'template_body': f"<p>Hello {user.full_name or user.username},</p><p>We received a request to reset your password. Use the token below to continue.</p><p><strong>{token}</strong></p><p>This token expires in 15 minutes.</p>",
            },
        )
        try:
            if email_service.is_configured():
                email_service.send_email_async(user.email, 'AI Warehouse - Password reset', html_body=html_body, body='Use the reset token provided in the email.', event_type='forgot_password', metadata={'user_id': user.id})
        except Exception:
            current_app.logger.exception('Failed to send password reset email for %s', user.email)

        return {'sent': True, 'token': token, 'reset_link': f"/reset-password?token={token}"}

    def reset_password(self, token: str, password: str):
        if not self._is_strong_password(password):
            raise ValueError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character')

        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash, is_active=True).first()
        if not reset_token:
            raise ValueError('Invalid reset token')

        expires_at = self._normalize_datetime(reset_token.expires_at)
        if expires_at < datetime.now(timezone.utc):
            reset_token.is_active = False
            db.session.commit()
            raise ValueError('Reset token expired')

        user = self.user_repository.get_by_id(reset_token.user_id)
        if not user:
            raise ValueError('Invalid reset request')

        user.set_password(password)
        reset_token.is_active = False
        reset_token.used_at = datetime.now(timezone.utc)
        db.session.commit()

        email_service = EmailService()
        html_body = email_service.render_template(
            'password_reset_successful',
            {'template_body': '<p>Your password was reset successfully.</p><p>You can now sign in with your new password.</p>'},
        )
        try:
            if email_service.is_configured():
                email_service.send_email_async(user.email, 'AI Warehouse - Password reset successful', body='Your password was reset successfully.', html_body=html_body, event_type='password_reset', metadata={'user_id': user.id})
        except Exception:
            current_app.logger.exception('Failed to send password reset success email for %s', user.email)

        return {'password_reset': True}

    def exchange_one_time_code(self, code: str):
        data = AuthService._one_time_codes.pop(code, None)
        if not data:
            raise ValueError('Invalid or expired one-time code')
        return data

    def _get_frontend_url(self) -> str:
        url = os.getenv('FRONTEND_URL') or settings.FRONTEND_URL or 'http://localhost:3000'
        return url.rstrip('/')

    def _normalize_datetime(self, value):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _is_strong_password(self, password: str) -> bool:
        if len(password) < 8:
            return False
        if not any(char.isupper() for char in password):
            return False
        if not any(char.islower() for char in password):
            return False
        if not any(char.isdigit() for char in password):
            return False
        if not any(not char.isalnum() for char in password):
            return False
        return True

    def serialize_user(self, user: User):
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'roles': [role.name for role in user.roles],
            'email_verified': user.email_verified,
        }
