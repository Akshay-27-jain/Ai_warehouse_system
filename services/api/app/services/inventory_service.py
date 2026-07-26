from datetime import datetime, timezone
from flask import current_app
from app.extensions import db
from app.models.email import NotificationPreference
from app.models.warehouse import InventoryItem, InventoryTransaction, Product
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.user_repository import UserRepository
from app.services.notification_service import NotificationService
from app.services.email_service import EmailService

notification_service = NotificationService()
email_service = EmailService()


class InventoryService:
    def __init__(self, repository=None):
        self.repository = repository or InventoryRepository()

    def list(self, filters=None, sort_by=None, sort_desc=False, page=1, per_page=20):
        items, total, pages = self.repository.list_inventory(filters=filters, sort_by=sort_by, sort_desc=sort_desc, page=page, per_page=per_page)
        product_ids = {item.product_id for item in items}
        from app.models.warehouse import Product
        products = Product.query.filter(Product.id.in_(product_ids)).all() if product_ids else []
        products_map = {p.id: p for p in products}
        return {
            'items': [self.serialize(item, products_map=products_map) for item in items],
            'total': total,
            'pages': pages,
            'page': page,
            'per_page': per_page,
        }

    def get(self, inventory_id):
        item = self.repository.get_by_id(inventory_id)
        if not item:
            raise ValueError('Inventory item not found')
        return self.serialize(item)

    def adjust(self, inventory_id, quantity, reason, performed_by=None):
        item = self.repository.get_by_id(inventory_id)
        if not item:
            raise ValueError('Inventory item not found')
        item.available_quantity = quantity
        item.last_adjusted_at = datetime.now(timezone.utc)
        db.session.commit()
        self.log_transaction(item, 'adjustment', quantity, reason, performed_by)
        return self.serialize(item)

    def stock_in(self, product_id, warehouse_id, quantity, reference=None, performed_by=None):
        return self._update_stock(product_id, warehouse_id, quantity, 'stock_in', reference, performed_by)

    def stock_out(self, product_id, warehouse_id, quantity, reference=None, performed_by=None):
        return self._update_stock(product_id, warehouse_id, -abs(quantity), 'stock_out', reference, performed_by)

    def _update_stock(self, product_id, warehouse_id, quantity, transaction_type, reference=None, performed_by=None):
        item = self.repository.get_by_product_and_warehouse(product_id, warehouse_id)
        if not item:
            item = self.repository.create({
                'product_id': product_id,
                'warehouse_id': warehouse_id,
                'available_quantity': 0,
                'reserved_quantity': 0,
                'reorder_point': 0,
                'low_stock_threshold': 10,
            })
        previous_quantity = item.available_quantity
        item.available_quantity += quantity
        if item.available_quantity < 0:
            raise ValueError('Insufficient stock')
        item.last_adjusted_at = datetime.now(timezone.utc)
        db.session.commit()
        self.log_transaction(item, transaction_type, quantity, reference, performed_by)

        try:
            product = Product.query.get(product_id)
            warehouse = item.warehouse
            if item.available_quantity == 0 and previous_quantity > 0:
                self._send_stock_alert('out_of_stock', item, product, warehouse, performed_by)
            elif item.available_quantity <= item.low_stock_threshold and previous_quantity > item.available_quantity:
                self._send_stock_alert('low_stock', item, product, warehouse, performed_by)
            elif item.available_quantity > item.maximum_stock and item.maximum_stock > 0:
                self._send_stock_alert('overstock', item, product, warehouse, performed_by)
        except Exception as exc:
            current_app.logger.exception('Stock alert processing failed: %s', exc)
        return self.serialize(item)

    def bulk_import(self, records, performed_by=None):
        results = []
        for record in records:
            product_id = record.get('product_id')
            if not product_id:
                product_id = None
                sku = record.get('sku')
                barcode = record.get('barcode')
                if sku:
                    product = Product.query.filter_by(sku=sku).first()
                elif barcode:
                    product = Product.query.filter_by(barcode=barcode).first()
                else:
                    raise ValueError('product_id, sku, or barcode is required for bulk import')
                if not product:
                    raise ValueError('Referenced product not found for bulk import')
                product_id = product.id
            warehouse_id = record.get('warehouse_id')
            if warehouse_id is None:
                raise ValueError('warehouse_id is required for bulk import')
            quantity = int(record.get('available_quantity', 0))
            item = self.repository.get_by_product_and_warehouse(product_id, warehouse_id)
            if not item:
                item = self.repository.create({
                    'product_id': product_id,
                    'warehouse_id': warehouse_id,
                    'available_quantity': quantity,
                    'reserved_quantity': int(record.get('reserved_quantity', 0)),
                    'reorder_point': int(record.get('reorder_point', 0)),
                    'low_stock_threshold': int(record.get('low_stock_threshold', 10)),
                })
            else:
                item.available_quantity = quantity
                item.reserved_quantity = int(record.get('reserved_quantity', item.reserved_quantity))
                item.reorder_point = int(record.get('reorder_point', item.reorder_point))
                item.low_stock_threshold = int(record.get('low_stock_threshold', item.low_stock_threshold))
            item.last_adjusted_at = datetime.now(timezone.utc)
            db.session.commit()
            self.log_transaction(item, 'bulk_import', quantity, record.get('reference'), performed_by)
            results.append(self.serialize(item))
        return results

    def export(self, filters=None):
        return self.list(filters=filters, sort_by=filters.get('sort_by') if filters else 'id', sort_desc=filters.get('sort_desc', False) if filters else False, page=1, per_page=10000)

    def transfer(self, product_id, source_warehouse_id, destination_warehouse_id, quantity, reference=None, performed_by=None):
        source_item = self.repository.get_by_product_and_warehouse(product_id, source_warehouse_id)
        if not source_item or source_item.available_quantity < quantity:
            raise ValueError('Insufficient stock to transfer')
        dest_item = self.repository.get_by_product_and_warehouse(product_id, destination_warehouse_id)
        if not dest_item:
            dest_item = self.repository.create({'product_id': product_id, 'warehouse_id': destination_warehouse_id, 'available_quantity': 0, 'reserved_quantity': 0, 'reorder_point': 0, 'low_stock_threshold': 10})
        source_item.available_quantity -= quantity
        dest_item.available_quantity += quantity
        source_item.last_adjusted_at = datetime.now(timezone.utc)
        dest_item.last_adjusted_at = datetime.now(timezone.utc)
        db.session.commit()
        self.log_transaction(source_item, 'transfer_out', -quantity, reference, performed_by)
        self.log_transaction(dest_item, 'transfer_in', quantity, reference, performed_by)
        try:
            title = 'Stock transferred'
            message = f'{quantity} units of product {product_id} moved from {source_warehouse_id} to {destination_warehouse_id}.'
            notification_service.create({
                'title': title,
                'message': message,
                'recipient_id': performed_by,
                'metadata': {'product_id': product_id, 'source': source_warehouse_id, 'destination': destination_warehouse_id}
            })
            if email_service.is_configured() and performed_by:
                user = UserRepository().get_by_id(performed_by)
                if user:
                    email_service.send_email_async(user.email, title, message, event_type='transfer', metadata={'product_id': product_id, 'source': source_warehouse_id, 'destination': destination_warehouse_id})
        except Exception:
            pass
        return {
            'source': self.serialize(source_item),
            'destination': self.serialize(dest_item),
        }

    def _send_stock_alert(self, alert_type, item, product, warehouse, performed_by=None):
        if not email_service.is_configured():
            return

        preference = NotificationPreference.query.filter_by(user_id=performed_by).first() if performed_by else None
        if preference and getattr(preference, self._preference_key(alert_type), True) is False:
            return

        if alert_type == 'low_stock':
            title = 'Low stock alert'
            message = f'{product.name if product else "Product"} is below the minimum stock threshold.'
            html = email_service.render_template('low_stock_alert', {'template_body': f'<p><strong>{product.name if product else "Product"}</strong> is running low.</p><ul><li>SKU: {product.sku if product else "-"}</li><li>Warehouse: {warehouse.name if warehouse else "-"}</li><li>Current quantity: {item.available_quantity}</li><li>Minimum quantity: {item.low_stock_threshold}</li></ul>'})
        elif alert_type == 'out_of_stock':
            title = 'URGENT: Product Out of Stock'
            message = f'{product.name if product else "Product"} is out of stock.'
            html = email_service.render_template('out_of_stock_alert', {'template_body': f'<p><strong>{product.name if product else "Product"}</strong> is now out of stock.</p><ul><li>SKU: {product.sku if product else "-"}</li><li>Warehouse: {warehouse.name if warehouse else "-"}</li><li>Current quantity: 0</li></ul>'})
        else:
            title = 'Overstock alert'
            message = f'{product.name if product else "Product"} exceeds the configured maximum stock.'
            html = email_service.render_template('overstock_alert', {'template_body': f'<p><strong>{product.name if product else "Product"}</strong> has exceeded the configured maximum capacity.</p><ul><li>SKU: {product.sku if product else "-"}</li><li>Warehouse: {warehouse.name if warehouse else "-"}</li><li>Current quantity: {item.available_quantity}</li><li>Maximum quantity: {item.maximum_stock}</li></ul>'})

        if performed_by:
            user = UserRepository().get_by_id(performed_by)
            if user and user.email:
                email_service.send_email_async(user.email, title, body=message, html_body=html, event_type=alert_type, metadata={'product_id': item.product_id, 'warehouse_id': item.warehouse_id})

    def _preference_key(self, alert_type):
        mapping = {'low_stock': 'low_stock', 'out_of_stock': 'out_of_stock', 'transfer': 'transfers', 'report': 'reports'}
        return mapping.get(alert_type, 'system_alerts')

    def history(self, inventory_id, page=1, per_page=20):
        query = InventoryTransaction.query.filter_by(inventory_item_id=inventory_id).order_by(InventoryTransaction.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            'items': [self.serialize_transaction(item) for item in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'page': page,
            'per_page': per_page,
        }

    def search(self, search_term, warehouse_id=None):
        items = self.repository.find_by_sku_or_barcode(search_term, warehouse_id)
        return [self.serialize(item) for item in items]

    def low_stock_alerts(self, warehouse_id=None):
        items = self.repository.get_low_stock(warehouse_id)
        return [self.serialize(item) for item in items]

    def log_transaction(self, item, transaction_type, quantity, reference=None, performed_by=None):
        transaction = InventoryTransaction(
            inventory_item_id=item.id,
            product_id=item.product_id,
            warehouse_id=item.warehouse_id,
            transaction_type=transaction_type,
            quantity=quantity,
            reference=reference,
            note=reference,
            performed_by=performed_by,
        )
        db.session.add(transaction)
        db.session.commit()
        return transaction

    def serialize(self, item, products_map=None):
        if products_map:
            product = products_map.get(item.product_id)
        else:
            product = Product.query.get(item.product_id)
        return {
            'id': item.id,
            'product_id': item.product_id,
            'warehouse_id': item.warehouse_id,
            'sku': product.sku if product else None,
            'barcode': product.barcode if product else None,
            'name': product.name if product else None,
            'available_quantity': item.available_quantity,
            'reserved_quantity': item.reserved_quantity,
            'reorder_point': item.reorder_point,
            'low_stock_threshold': item.low_stock_threshold,
            'last_adjusted_at': item.last_adjusted_at.isoformat() if item.last_adjusted_at else None,
        }

    def serialize_transaction(self, transaction):
        return {
            'id': transaction.id,
            'inventory_item_id': transaction.inventory_item_id,
            'product_id': transaction.product_id,
            'warehouse_id': transaction.warehouse_id,
            'transaction_type': transaction.transaction_type,
            'quantity': transaction.quantity,
            'reference': transaction.reference,
            'note': transaction.note,
            'performed_by': transaction.performed_by,
            'created_at': transaction.created_at.isoformat(),
        }
