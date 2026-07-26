from flask import Blueprint
from app.controllers.warehouse_controller import WarehouseController, ProductController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('warehouse', __name__, url_prefix='/api/v1/warehouses')
warehouse_controller = WarehouseController()
product_controller = ProductController()


@bp.route('', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def list_warehouses():
    return warehouse_controller.list()


@bp.route('', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def create_warehouse():
    return warehouse_controller.create()


@bp.route('/<int:warehouse_id>', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def get_warehouse(warehouse_id):
    return warehouse_controller.get(warehouse_id)


@bp.route('/<int:warehouse_id>', methods=['PUT'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def update_warehouse(warehouse_id):
    return warehouse_controller.update(warehouse_id)


@bp.route('/<int:warehouse_id>', methods=['DELETE'])
@jwt_required_with_roles('Admin')
def delete_warehouse(warehouse_id):
    return warehouse_controller.delete(warehouse_id)


@bp.route('/products', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def list_products():
    return product_controller.list()


@bp.route('/products', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Planner')
def create_product():
    return product_controller.create()


@bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst', 'Viewer')
def get_product(product_id):
    return product_controller.get(product_id)


@bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Planner')
def update_product(product_id):
    return product_controller.update(product_id)


@bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required_with_roles('Admin', 'Warehouse Manager')
def delete_product(product_id):
    return product_controller.delete(product_id)
