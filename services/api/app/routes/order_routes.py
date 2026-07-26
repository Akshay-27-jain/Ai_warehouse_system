from flask import Blueprint
from app.controllers.order_controller import OrderController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('orders', __name__, url_prefix='/api/v1/orders')
order_controller = OrderController()


@bp.route('', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def list_orders():
    return order_controller.list()


@bp.route('', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Planner')
def create_order():
    return order_controller.create()


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def get_order(order_id):
    return order_controller.get(order_id)


@bp.route('/<int:order_id>', methods=['PUT'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Planner')
def update_order(order_id):
    return order_controller.update(order_id)


@bp.route('/<int:order_id>', methods=['DELETE'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def delete_order(order_id):
    return order_controller.delete(order_id)
