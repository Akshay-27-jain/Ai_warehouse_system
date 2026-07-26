from flask import Blueprint
from app.controllers.notification_controller import NotificationController
from app.middlewares.auth_middleware import jwt_required_with_roles

bp = Blueprint('notifications', __name__, url_prefix='/api/v1/notifications')
notification_controller = NotificationController()


@bp.route('/preferences', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def get_preferences():
    return notification_controller.get_preferences()


@bp.route('/preferences', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def save_preferences():
    return notification_controller.save_preferences()


@bp.route('/test-email', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def test_email():
    return notification_controller.test_email()


@bp.route('/', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def list_notifications():
    return notification_controller.list()


@bp.route('/unread-count', methods=['GET'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def unread_count():
    return notification_controller.unread_count()


@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def mark_read(notification_id):
    return notification_controller.mark_read(notification_id)


@bp.route('/mark-all-read', methods=['POST'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def mark_all_read():
    return notification_controller.mark_all_read()


@bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required_with_roles('Admin', 'Warehouse Manager', 'Inventory Manager', 'Planner', 'Analyst')
def delete_notification(notification_id):
    return notification_controller.delete(notification_id)
