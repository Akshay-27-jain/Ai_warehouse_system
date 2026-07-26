from flask import Blueprint
from app.controllers.inventory_controller import InventoryController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('inventory', __name__, url_prefix='/api/v1/inventory')
inventory_controller = InventoryController()


@bp.route('', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def list_inventory():
    return inventory_controller.list()


@bp.route('/<int:inventory_id>', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def get_inventory(inventory_id):
    return inventory_controller.get(inventory_id)


@bp.route('/stock-in', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager')
def stock_in():
    return inventory_controller.stock_in()


@bp.route('/stock-out', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager')
def stock_out():
    return inventory_controller.stock_out()


@bp.route('/adjust', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def adjust_inventory():
    return inventory_controller.adjust()


@bp.route('/transfer', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def transfer_stock():
    return inventory_controller.transfer()


@bp.route('/import', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def import_inventory():
    return inventory_controller.import_data()


@bp.route('/export', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def export_inventory():
    return inventory_controller.export_csv()


@bp.route('/<int:inventory_id>/history', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def inventory_history(inventory_id):
    return inventory_controller.history(inventory_id)


@bp.route('/search', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def search_inventory():
    return inventory_controller.search()


@bp.route('/low-stock', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def low_stock():
    return inventory_controller.low_stock()
