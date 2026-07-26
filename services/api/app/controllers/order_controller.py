from flask import current_app, request
from marshmallow import ValidationError
from app.services.crud_service import CRUDService
from app.repositories.order_repository import OrderRepository
from app.validators.resource_validators import OrderSchema
from app.utils.response import success_response, error_response
from app.services.notification_service import NotificationService

notification_service = NotificationService()


class OrderController:
    def __init__(self):
        self.service = CRUDService(OrderRepository())

    def list(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        sort_by = request.args.get('sort_by', 'id')
        sort_desc = request.args.get('sort_desc', 'false').lower() == 'true'
        filters = {
            'status': request.args.get('status'),
            'order_number': request.args.get('order_number'),
        }
        return success_response(self.service.list(filters=filters, sort_by=sort_by, sort_desc=sort_desc, page=page, per_page=per_page))

    def create(self):
        try:
            payload = OrderSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        result = self.service.create(payload)
        try:
            user = getattr(request, 'current_user', None)
            notification_service.create_and_notify({
                'title': 'New Order Created',
                'message': f"Order {result.get('order_number')} created.",
                'recipient_id': user.id if user else None,
                'metadata': {'order_id': result.get('id')}
            })
        except Exception:
            pass
        return success_response(result, 'Order created', 201)

    def get(self, order_id):
        try:
            return success_response(self.service.get(order_id))
        except ValueError as exc:
            return error_response(str(exc), 404)

    def update(self, order_id):
        try:
            payload = OrderSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            return success_response(self.service.update(order_id, payload), 'Order updated', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)

    def delete(self, order_id):
        try:
            return success_response(self.service.delete(order_id), 'Order deleted', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)
