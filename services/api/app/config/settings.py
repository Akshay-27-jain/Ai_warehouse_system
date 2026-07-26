import os
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv


def _find_env_file():
    current_path = Path(__file__).resolve()
    for parent in [current_path, *current_path.parents]:
        env_path = parent / '.env'
        if env_path.exists():
            return env_path
    return current_path.parents[2] / '.env'


def _load_env_file():
    env_path = _find_env_file()
    load_dotenv(env_path, override=True)
    return env_path

ENV_FILE_PATH = _load_env_file()

class Settings:
    ENV_FILE_PATH = ENV_FILE_PATH
    PROJECT_NAME = os.getenv('PROJECT_NAME', 'AI Warehouse Optimization System')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-replace-before-production-32b')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-replace-before-production-32b')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 900))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 86400))
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ACCESS_COOKIE_PATH = '/api/'
    JWT_REFRESH_COOKIE_PATH = '/api/v1/auth/refresh'
    JWT_COOKIE_CSRF_PROTECT = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'true').lower() == 'true'
    JWT_COOKIE_SECURE = os.getenv('JWT_COOKIE_SECURE', 'false').lower() == 'true'
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE', 'Strict')
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    REMEMBER_COOKIE_SECURE = os.getenv('REMEMBER_COOKIE_SECURE', 'false').lower() == 'true'
    WTF_CSRF_TIME_LIMIT = int(os.getenv('WTF_CSRF_TIME_LIMIT', 3600))
    PROPAGATE_EXCEPTIONS = os.getenv('FLASK_ENV', 'development') == 'development'
    JSON_SORT_KEYS = False

    DB_HOST = os.getenv('DB_HOST') or os.getenv('POSTGRES_HOST')
    DB_PORT = os.getenv('DB_PORT') or os.getenv('POSTGRES_PORT')
    DB_NAME = os.getenv('DB_NAME') or os.getenv('POSTGRES_DB')
    DB_USER = os.getenv('DB_USER') or os.getenv('POSTGRES_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD') or os.getenv('POSTGRES_PASSWORD')
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()

    @staticmethod
    def _build_postgres_uri(host, port, name, user, password):
        return (
            f"postgresql://{user}:{quote_plus(password)}@{host}:{port}/{name}"
        )

    if DB_HOST and DB_PORT and DB_NAME and DB_USER and DB_PASSWORD:
        SQLALCHEMY_DATABASE_URI = _build_postgres_uri(DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
    elif DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        raise RuntimeError(
            'PostgreSQL configuration not found. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD '
            'or DATABASE_URL to a Postgres URI. SQLite fallback has been disabled.'
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SWAGGER_URL = os.getenv('SWAGGER_URL', '/docs')
    API_VERSION = os.getenv('API_VERSION', 'v1')
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')
    PRODUCTION_CORS_ORIGINS = os.getenv('PRODUCTION_CORS_ORIGINS', '')
    DEV_CORS_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3001'
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '') or (PRODUCTION_CORS_ORIGINS if FLASK_ENV == 'production' else DEV_CORS_ORIGINS)
    MAIL_SERVER = os.getenv('MAIL_SERVER', '')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'no-reply@aiwarehouse.com')

    @staticmethod
    def _load_google_client_json():
        candidate_names = ['client_secret.json', 'client_secrets.json', 'credentials.json', 'gcp_client_secret.json', 'google_client_secret.json']
        search_dirs = [
            Path.cwd(),
            ENV_FILE_PATH.parent if ENV_FILE_PATH else Path.cwd(),
            (ENV_FILE_PATH.parent / 'services' / 'api') if ENV_FILE_PATH else Path.cwd(),
            (ENV_FILE_PATH.parent / 'config') if ENV_FILE_PATH else Path.cwd()
        ]
        
        import json
        for sdir in search_dirs:
            for name in candidate_names:
                json_file = sdir / name
                if json_file.exists():
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        payload = data.get('web') or data.get('installed') or data
                        cid = payload.get('client_id', '')
                        csecret = payload.get('client_secret', '')
                        token_uri = payload.get('token_uri', 'https://oauth2.googleapis.com/token')
                        redirect_uris = payload.get('redirect_uris', [])
                        redirect_uri = redirect_uris[0] if redirect_uris else 'http://localhost:5000/api/v1/auth/google/callback'
                        return {
                            'client_id': cid,
                            'client_secret': csecret,
                            'token_uri': token_uri,
                            'redirect_uri': redirect_uri
                        }
                    except Exception:
                        pass
        return {}

    _json_oauth = _load_google_client_json()

    GMAIL_CLIENT_ID = os.getenv('GMAIL_CLIENT_ID') or _json_oauth.get('client_id', '')
    GMAIL_CLIENT_SECRET = os.getenv('GMAIL_CLIENT_SECRET') or _json_oauth.get('client_secret', '')
    GMAIL_REFRESH_TOKEN = os.getenv('GMAIL_REFRESH_TOKEN', '')
    GMAIL_USER_EMAIL = os.getenv('GMAIL_USER_EMAIL', MAIL_USERNAME)
    GMAIL_TOKEN_URI = os.getenv('GMAIL_TOKEN_URI') or _json_oauth.get('token_uri', 'https://oauth2.googleapis.com/token')

    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID') or GMAIL_CLIENT_ID or _json_oauth.get('client_id', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET') or GMAIL_CLIENT_SECRET or _json_oauth.get('client_secret', '')
    GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI') or _json_oauth.get('redirect_uri', 'http://localhost:5000/api/v1/auth/google/callback')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

settings = Settings()
