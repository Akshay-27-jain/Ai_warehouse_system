from flask import current_app, request
from marshmallow import ValidationError
from app.services.crud_service import CRUDService
from app.repositories.warehouse_repository import WarehouseRepository, CategoryRepository, SupplierRepository, ProductRepository, InventoryRepository
from app.validators.resource_validators import WarehouseSchema, ProductSchema
from app.utils.response import success_response, error_response
from app.services.notification_service import NotificationService
from app.services.email_service import EmailService
from app.repositories.user_repository import UserRepository

notification_service = NotificationService()
email_service = EmailService()


class WarehouseController:
    def __init__(self):
        self.service = CRUDService(WarehouseRepository())

    def list(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        sort_by = request.args.get('sort_by', 'id')
        sort_desc = request.args.get('sort_desc', 'false').lower() == 'true'
        filters = {
            'name': request.args.get('name'),
            'code': request.args.get('code'),
        }
        return success_response(self.service.list(filters=filters, sort_by=sort_by, sort_desc=sort_desc, page=page, per_page=per_page))

    def create(self):
        try:
            payload = WarehouseSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        result = self.service.create(payload)
        # create notification for the creator if available
        try:
            user = getattr(request, 'current_user', None)
            notif = {
                'title': 'New Warehouse created',
                'message': f"Warehouse '{result.get('name') or result.get('id')}' created by {user.full_name if user else 'system'}",
                'recipient_id': user.id if user else None,
                'metadata': {'warehouse_id': result.get('id')}
            }
            notification_service.create(notif)
            if email_service.is_configured() and user:
                email_service.send_email_async(user.email, 'Warehouse created', notif['message'])
        except Exception as exc:
            current_app.logger.exception('Failed to send warehouse creation notification: %s', exc)
        return success_response(result, 'Warehouse created', 201)

    def get(self, warehouse_id):
        try:
            return success_response(self.service.get(warehouse_id))
        except ValueError as exc:
            return error_response(str(exc), 404)

    def update(self, warehouse_id):
        try:
            payload = WarehouseSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            return success_response(self.service.update(warehouse_id, payload), 'Warehouse updated', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)

    def delete(self, warehouse_id):
        try:
            # prevent accidental deletion when inventory exists unless force=true provided
            from app.models.warehouse import InventoryItem

            has_inventory = InventoryItem.query.filter(InventoryItem.warehouse_id == warehouse_id).count() > 0
            force = request.args.get('force', 'false').lower() == 'true'
            if has_inventory and not force:
                return error_response('Warehouse has inventory. Pass ?force=true to delete.', 400)

            result = self.service.delete(warehouse_id)
            try:
                user = getattr(request, 'current_user', None)
                notification_service.create({
                    'title': 'Warehouse deleted',
                    'message': f'Warehouse #{warehouse_id} deleted by {user.full_name if user else "system"}',
                    'recipient_id': user.id if user else None,
                    'metadata': {'warehouse_id': warehouse_id}
                })
            except Exception as exc:
                current_app.logger.exception('Failed to send warehouse deletion notification: %s', exc)
            return success_response(result, 'Warehouse deleted', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)


class ProductController:
    def __init__(self):
        self.service = CRUDService(ProductRepository())

    def list(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        sort_by = request.args.get('sort_by', 'id')
        sort_desc = request.args.get('sort_desc', 'false').lower() == 'true'
        filters = {
            'name': request.args.get('name'),
            'sku': request.args.get('sku'),
        }
        return success_response(self.service.list(filters=filters, sort_by=sort_by, sort_desc=sort_desc, page=page, per_page=per_page))

    def create(self):
        try:
            payload = ProductSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        result = self.service.create(payload)
        try:
            warehouse_id = request.args.get('warehouse_id')
            manager = UserRepository().get_by_email('manager@aiwarehouse.com') or UserRepository().get_by_id(1)
            if manager and manager.email:
                email_service.send_email_async(
                    manager.email,
                    'New product added',
                    f"New product {result.get('name')} was added to the warehouse.",
                    html_body=email_service.render_template('new_product', {'template_body': f'<p><strong>{result.get("name")}</strong> has been added.</p><ul><li>Category: {result.get("category_id")}</li><li>SKU: {result.get("sku")}</li><li>Warehouse: {warehouse_id or "default"}</li><li>Initial quantity: 0</li></ul>'}),
                    event_type='new_product',
                    metadata={'product_id': result.get('id')},
                )
        except Exception as exc:
            current_app.logger.exception('Failed to send product creation notification: %s', exc)
        return success_response(result, 'Product created', 201)

    def get(self, product_id):
        try:
            return success_response(self.service.get(product_id))
        except ValueError as exc:
            return error_response(str(exc), 404)

    def update(self, product_id):
        try:
            payload = ProductSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            return success_response(self.service.update(product_id, payload), 'Product updated', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)

    def delete(self, product_id):
        try:
            result = self.service.delete(product_id)
            try:
                user = getattr(request, 'current_user', None)
                notification_service.create_and_notify({
                    'title': 'Product deleted',
                    'message': f'Product #{product_id} deleted by {user.full_name if user else "system"}',
                    'recipient_id': user.id if user else None,
                    'metadata': {'product_id': product_id}
                })
            except Exception as exc:
                current_app.logger.exception('Failed to send product deletion notification: %s', exc)
            return success_response(result, 'Product deleted', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)
