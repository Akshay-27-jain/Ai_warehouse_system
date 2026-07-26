from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.controllers.auth_controller import AuthController
from app.extensions import limiter

bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')
auth_controller = AuthController()


@bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    return auth_controller.register()


@bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    return auth_controller.login()


@bp.route('/google/login', methods=['GET'])
def google_login():
    return auth_controller.google_login()


@bp.route('/google/callback', methods=['GET'])
def google_callback():
    return auth_controller.google_callback()


@bp.route('/google/exchange', methods=['POST'])
@limiter.limit("10 per minute")
def google_exchange():
    data = request.get_json(force=True)
    code = data.get('code', '') if data else ''
    from app.utils.response import success_response, error_response
    try:
        from app.services.auth_service import AuthService
        svc = AuthService()
        result = svc.exchange_one_time_code(code)
        return success_response(result, 'Google sign-in successful', 200)
    except ValueError as exc:
        return error_response(str(exc), 400)


# Some OAuth clients (or Google console examples) use /oauth2callback as the redirect URI.
# Support that path by forwarding to the same callback handler so registered URIs work.
@bp.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    return auth_controller.google_callback()


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return auth_controller.logout()


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    return auth_controller.refresh_token()


@bp.route('/verify-email', methods=['GET'])
def verify_email():
    return auth_controller.verify_email()


@bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    return auth_controller.forgot_password()


@bp.route('/reset-password', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password():
    return auth_controller.reset_password()
