from flask import Blueprint
from app.controllers.dashboard_controller import DashboardController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('dashboard', __name__, url_prefix='/api/v1/dashboard')
dashboard_controller = DashboardController()


@bp.route('/summary', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def dashboard_summary():
    return dashboard_controller.summary()
