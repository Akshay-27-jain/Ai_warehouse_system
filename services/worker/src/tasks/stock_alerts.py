"""
Background worker task to check low stock items and queue alerts.
"""
from datetime import datetime
import os
import sys

# Support importing API models if running in same venv
api_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../api'))
if api_path not in sys.path:
    sys.path.insert(0, api_path)


def check_and_alert_low_stock(app_context=None):
    """
    Scans inventory items and creates notifications for items below safety thresholds.
    """
    from app.extensions import db
    from app.models.warehouse import InventoryItem, Product
    from app.services.notification_service import NotificationService

    low_items = InventoryItem.query.filter(
        InventoryItem.available_quantity <= InventoryItem.low_stock_threshold
    ).all()

    alerts_sent = 0
    service = NotificationService()

    for item in low_items:
        product_name = item.product.name if item.product else f"Product #{item.product_id}"
        wh_name = item.warehouse.name if item.warehouse else f"Warehouse #{item.warehouse_id}"
        service.create_and_notify({
            'title': f'Low Stock Alert: {product_name}',
            'message': f'Available quantity is {item.available_quantity} at {wh_name} (Threshold: {item.low_stock_threshold}).',
            'status': 'unread',
            'link': '/inventory'
        }, send_email=False)
        alerts_sent += 1

    return {
        'status': 'completed',
        'timestamp': datetime.utcnow().isoformat(),
        'alerts_sent': alerts_sent
    }
