import os
from flask import Flask, redirect, request
from sqlalchemy import inspect, text
from flasgger import Swagger
from flask_cors import CORS
from app.config.settings import settings
from app.extensions import cors, db, jwt, limiter, swagger, csrf, talisman, migrate
from app.extensions import socketio
from app.routes.auth_routes import bp as auth_bp
from app.routes.inventory_routes import bp as inventory_bp
from app.routes.order_routes import bp as order_bp
from app.routes.warehouse_routes import bp as warehouse_bp
from app.routes.dashboard_routes import bp as dashboard_bp
from app.routes.notification_routes import bp as notification_bp
from app.routes.ai_routes import bp as ai_bp
from app.utils.logging import configure_logging
from app.utils.seed_data import seed_database
from app.models.user import TokenBlocklist
from app.services.email_service import EmailService


def _verify_database_connection():
    try:
        with db.engine.connect() as connection:
            connection.execute(text('SELECT 1'))
    except Exception as exc:
        raise RuntimeError(f'Unable to connect to the database: {exc}') from exc


def create_app():
    app = Flask(__name__)
    app.config.from_object(settings)
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.SQLALCHEMY_DATABASE_URI
    app.config['JWT_SECRET_KEY'] = settings.JWT_SECRET_KEY
    app.logger.info('Loaded env file: %s', getattr(settings, 'ENV_FILE_PATH', 'unknown'))
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    safe_url = db_url.split('@')[-1] if '@' in db_url else db_url
    app.logger.info('Using database at: %s', safe_url)
    app.config['SWAGGER'] = {
        'title': 'AI Warehouse API',
        'uiversion': 3,
        'openapi': '3.0.2',
    }

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    allowed_origins = "*" if app.config.get('FLASK_ENV') == 'development' else app.config['CORS_ORIGINS'].split(',')
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})
    limiter.init_app(app)
    
    # Security headers
    talisman.init_app(
        app,
        force_https=app.config.get('FLASK_ENV') == 'production',
        content_security_policy=None,  # Adjust CSP based on needs
        session_cookie_secure=app.config.get('SESSION_COOKIE_SECURE', False),
        session_cookie_http_only=True,
        session_cookie_samesite=app.config.get('SESSION_COOKIE_SAMESITE', 'Lax')
    )

    csrf.init_app(app)
    # initialize SocketIO after extensions
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'].split(','))
    swagger.init_app(app)
    configure_logging(app)

    @app.route('/')
    def root():
        return {
            'name': 'AI Warehouse Optimization System API',
            'version': '1.0.0',
            'status': 'online',
            'documentation': '/docs',
            'health': '/health'
        }, 200

    @app.route('/health')
    def health_check():
        from sqlalchemy import text as sql_text
        try:
            db.session.execute(sql_text('SELECT 1')).scalar()
            return {'status': 'healthy', 'timestamp': db.session.execute(sql_text('SELECT NOW()')).scalar().isoformat()}, 200
        except Exception as exc:
            return {'status': 'unhealthy', 'error': str(exc)}, 503

    with app.app_context():
        if db.engine.url.drivername.startswith('sqlite'):
            raise RuntimeError(
                'SQLite is disabled for this application. Configure PostgreSQL via DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, or DATABASE_URL.'
            )
        email_service = EmailService()
        if email_service.is_configured():
            configured_via = 'Gmail OAuth' if email_service._gmail_configured() else 'SMTP'
            app.logger.info('Email service configuration detected via %s', configured_via)
        else:
            app.logger.warning('Email service is not configured. Email settings are missing; email features will be disabled gracefully.')
        app.logger.info(
            'Database engine connection: host=%s port=%s db=%s user=%s',
            db.engine.url.host,
            db.engine.url.port,
            db.engine.url.database,
            db.engine.url.username,
        )
        try:
            _verify_database_connection()
            app.logger.info('Database connection verified')
            seed_database()
            app.logger.info('Database seeding check complete')
        except Exception as exc:
            app.logger.error('Database connection failed: %s', exc)
            raise

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        return TokenBlocklist.query.filter_by(jti=jti).first() is not None

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token expired'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token'}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Missing token'}, 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return {'error': 'Fresh token required'}, 401

    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(warehouse_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(ai_bp)

    for api_blueprint in [auth_bp, inventory_bp, warehouse_bp, order_bp, dashboard_bp, notification_bp, ai_bp]:
        csrf.exempt(api_blueprint)

    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request', 'message': str(error.description) if hasattr(error, 'description') else 'Bad request'}, 400

    @app.errorhandler(401)
    def unauthorized(error):
        return {'error': 'Unauthorized'}, 401

    @app.errorhandler(403)
    def forbidden(error):
        return {'error': 'Forbidden'}, 403

    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(500)
    def server_error(error):
        app.logger.exception('Unhandled exception')
        return {'error': 'Internal server error'}, 500

    with app.app_context():
        from app.models.user import User, Role, Permission, UserRole, RolePermission
        from app.models.warehouse import Warehouse, Category, Supplier, Product, InventoryItem, InventoryTransaction
        from app.models.order import Order, OrderItem
        from app.models.analytics import PredictionHistory
        from app.models.demand_prediction import DemandPrediction
        from app.models.notification import Notification
        from app.models.weather import Weather
        from app.models.festival import Festival
        from app.models.email import EmailLog, EmailQueue, NotificationPreference, PasswordResetToken, AppSetting
        db.create_all()
        _ensure_database_columns()
        seed_database()

    # Support root-level OAuth2 callback URLs (some OAuth clients use /oauth2callback)
    @app.route('/oauth2callback', methods=['GET'])
    def _oauth2callback_forward():
        # Forward the original query string to the registered auth callback endpoint.
        qs = request.query_string.decode() if request.query_string else ''
        target = f"/api/v1/auth/google/callback{ '?' + qs if qs else '' }"
        return redirect(target)

    return app


def _ensure_database_columns():
    inspector = inspect(db.engine)
    table_names = set(inspector.get_table_names())
    statements = []

    if 'users' in table_names:
        user_columns = {column['name'] for column in inspector.get_columns('users')}
        if 'email_verified' not in user_columns:
            statements.append('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE')
        if 'verified_at' not in user_columns:
            statements.append('ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP')

    if 'products' in table_names:
        product_columns = {column['name'] for column in inspector.get_columns('products')}
        if 'barcode' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(150)')
        if 'minimum_stock_level' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_stock_level INTEGER NOT NULL DEFAULT 0')
        if 'maximum_stock_level' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS maximum_stock_level INTEGER NOT NULL DEFAULT 0')
        if 'safety_stock' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 0')
        if 'alert_threshold' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_threshold INTEGER NOT NULL DEFAULT 0')
        if 'email_alert_enabled' not in product_columns:
            statements.append('ALTER TABLE products ADD COLUMN IF NOT EXISTS email_alert_enabled BOOLEAN NOT NULL DEFAULT TRUE')

    if 'inventory_items' in table_names:
        inventory_columns = {column['name'] for column in inspector.get_columns('inventory_items')}
        if 'low_stock_threshold' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 10')
        if 'last_adjusted_at' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_adjusted_at TIMESTAMP')
        if 'minimum_stock' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0')
        if 'maximum_stock' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS maximum_stock INTEGER NOT NULL DEFAULT 0')
        if 'safety_stock' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 0')
        if 'alert_threshold' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS alert_threshold INTEGER NOT NULL DEFAULT 0')
        if 'email_alert_enabled' not in inventory_columns:
            statements.append('ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS email_alert_enabled BOOLEAN NOT NULL DEFAULT TRUE')

    if 'orders' in table_names:
        order_columns = {column['name'] for column in inspector.get_columns('orders')}
        if 'delivered_at' not in order_columns:
            statements.append('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP')
        if 'delivery_status' not in order_columns:
            statements.append("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) NOT NULL DEFAULT 'pending'")
        if 'payment_status' not in order_columns:
            statements.append("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid'")
        if 'payment_method' not in order_columns:
            statements.append("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'not_selected'")
        if 'payment_reference' not in order_columns:
            statements.append('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100)')

    for statement in statements:
        db.session.execute(text(statement))
    if statements:
        db.session.commit()
