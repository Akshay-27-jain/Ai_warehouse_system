from urllib.parse import quote

import base64
import json

from flask import redirect, request
from marshmallow import ValidationError
from app.services.auth_service import AuthService
from app.validators.auth_validators import (
    ForgotPasswordSchema,
    LoginSchema,
    RegisterSchema,
    ResetPasswordSchema,
)
from app.utils.response import success_response, error_response


class AuthController:
    def __init__(self, auth_service=None):
        self.auth_service = auth_service or AuthService()

    def register(self):
        try:
            payload = RegisterSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            user = self.auth_service.register(payload)
            return success_response({'user_id': user.id}, 'User registered successfully', 201)
        except ValueError as exc:
            return error_response(str(exc), 400)

    def google_login(self):
        try:
            return self.auth_service.initiate_google_login()
        except ValueError as exc:
            return error_response(str(exc), 400)

    def google_callback(self):
        try:
            code = request.args.get('code', '')
            if not code:
                raise ValueError('Google login callback is missing the authorization code.')
            result = self.auth_service.handle_google_callback(code)
            frontend_url = self.auth_service._get_frontend_url()
            code_data = AuthService._one_time_codes.get(result['code'], {})
            payload = {
                'code': result['code'],
                'access_token': code_data.get('access_token'),
                'refresh_token': code_data.get('refresh_token'),
                'user': code_data.get('user')
            }
            state_data = base64.b64encode(json.dumps(payload).encode()).decode()
            redirect_url = f"{frontend_url}/login?state={state_data}"
            return redirect(redirect_url)
        except ValueError as exc:
            frontend_url = self.auth_service._get_frontend_url()
            state_data = base64.b64encode(json.dumps({'error': str(exc)}).encode()).decode()
            return redirect(f"{frontend_url}/login?state={state_data}")

    def login(self):
        try:
            payload = LoginSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.auth_service.login(payload['identifier'], payload['password'])
            return success_response(result, 'Login successful', 200)
        except ValueError as exc:
            return error_response(str(exc), 401)

    def logout(self):
        try:
            return success_response(self.auth_service.logout(), 'Logout successful', 200)
        except ValueError as exc:
            return error_response(str(exc), 400)

    def refresh_token(self):
        try:
            return success_response(self.auth_service.refresh_token(), 'Token refreshed', 200)
        except ValueError as exc:
            return error_response(str(exc), 401)

    def verify_email(self):
        try:
            token = request.args.get('token')
            if not token:
                raise ValueError('Verification token is required')
            return success_response(self.auth_service.verify_email(token), 'Email verified', 200)
        except ValueError as exc:
            return error_response(str(exc), 400)

    def forgot_password(self):
        try:
            payload = ForgotPasswordSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.auth_service.forgot_password(payload['email'])
            return success_response(result, 'Password reset email sent', 200)
        except ValueError as exc:
            return error_response(str(exc), 400)

    def reset_password(self):
        try:
            payload = ResetPasswordSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            self.auth_service.reset_password(payload['token'], payload['password'])
            return success_response({'reset': True}, 'Password reset successfully', 200)
        except ValueError as exc:
            return error_response(str(exc), 400)
