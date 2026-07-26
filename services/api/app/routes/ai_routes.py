"""
AI Routes blueprint for forecasting, rebalancing, and festival demand endpoints.
"""
from flask import Blueprint

from app.controllers.ai_controller import AIController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('ai', __name__, url_prefix='/api/v1/ai')
ai_controller = AIController()


@bp.route('/forecast', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def forecast_demand():
    return ai_controller.forecast_demand()


@bp.route('/rebalance', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def rebalance_stock():
    return ai_controller.rebalance_stock()


@bp.route('/festival-demand', methods=['GET', 'POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def festival_demand():
    return ai_controller.festival_demand()


@bp.route('/copilot/chat', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def copilot_chat():
    return ai_controller.copilot_chat()


@bp.route('/mcp/tools', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst', 'Viewer')
def list_mcp_tools():
    return ai_controller.list_mcp_tools()

