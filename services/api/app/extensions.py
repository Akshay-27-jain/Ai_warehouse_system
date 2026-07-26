from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flasgger import Swagger
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf import CSRFProtect
from flask_socketio import SocketIO
from flask_talisman import Talisman
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
swagger = Swagger()
cors = CORS()
limiter = Limiter(key_func=get_remote_address, default_limits=["250 per day", "60 per hour"], headers_enabled=True)
csrf = CSRFProtect()
socketio = SocketIO()
talisman = Talisman()
migrate = Migrate()
