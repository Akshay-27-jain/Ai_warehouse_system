import csv
from io import StringIO
from flask import Response, request
from marshmallow import ValidationError
from app.services.inventory_service import InventoryService
from app.validators.inventory_validators import (
    StockInSchema,
    StockOutSchema,
    AdjustSchema,
    TransferSchema,
)
from app.utils.response import success_response, error_response


class InventoryController:
    def __init__(self):
        self.service = InventoryService()

    def list(self):
        from app.validators.inventory_validators import InventoryQuerySchema
        try:
            params = InventoryQuerySchema().load(request.args)
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        filters = {
            'search': params.get('search'),
            'warehouse_id': params.get('warehouse_id'),
        }
        return success_response(self.service.list(filters=filters, sort_by=params['sort_by'], sort_desc=params['sort_desc'], page=params['page'], per_page=params['per_page']))

    def get(self, inventory_id):
        try:
            return success_response(self.service.get(inventory_id))
        except ValueError as exc:
            return error_response(str(exc), 404)

    def stock_in(self):
        try:
            payload = StockInSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.service.stock_in(
                payload['product_id'],
                payload['warehouse_id'],
                payload['quantity'],
                payload.get('reference'),
                payload.get('performed_by'),
            )
            return success_response(result, 'Stock added', 200)
        except (ValueError) as exc:
            return error_response(str(exc), 400)

    def stock_out(self):
        try:
            payload = StockOutSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.service.stock_out(
                payload['product_id'],
                payload['warehouse_id'],
                payload['quantity'],
                payload.get('reference'),
                payload.get('performed_by'),
            )
            return success_response(result, 'Stock removed', 200)
        except (ValueError) as exc:
            return error_response(str(exc), 400)

    def adjust(self):
        try:
            payload = AdjustSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.service.adjust(
                payload['inventory_id'],
                payload['quantity'],
                payload.get('reason'),
                payload.get('performed_by'),
            )
            return success_response(result, 'Inventory adjusted', 200)
        except (ValueError) as exc:
            return error_response(str(exc), 400)

    def transfer(self):
        try:
            payload = TransferSchema().load(request.get_json(force=True))
        except ValidationError as exc:
            return error_response('Validation failed', 400, exc.messages)
        try:
            result = self.service.transfer(
                payload['product_id'],
                payload['source_warehouse_id'],
                payload['destination_warehouse_id'],
                payload['quantity'],
                payload.get('reference'),
                payload.get('performed_by'),
            )
            return success_response(result, 'Stock transferred', 200)
        except (ValueError) as exc:
            return error_response(str(exc), 400)

    def import_data(self):
        payload = request.get_json(force=True)
        if not isinstance(payload, list):
            return error_response('A list of inventory records is required', 400)
        try:
            results = self.service.bulk_import(payload, performed_by=payload[0].get('performed_by') if payload else None)
            return success_response({'items': results}, 'Inventory imported', 200)
        except (ValueError, TypeError) as exc:
            return error_response(str(exc), 400)

    def export_csv(self):
        warehouse_id = request.args.get('warehouse_id')
        filters = {
            'warehouse_id': int(warehouse_id) if warehouse_id else None,
        }
        result = self.service.export(filters=filters)
        items = result.get('items', [])

        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(['inventory_id', 'product_id', 'warehouse_id', 'sku', 'barcode', 'name', 'available_quantity', 'reserved_quantity', 'reorder_point', 'low_stock_threshold', 'last_adjusted_at'])
        for item in items:
            writer.writerow([
                item['id'],
                item['product_id'],
                item['warehouse_id'],
                item['sku'],
                item['barcode'],
                item['name'],
                item['available_quantity'],
                item['reserved_quantity'],
                item['reorder_point'],
                item['low_stock_threshold'],
                item['last_adjusted_at'],
            ])

        response = Response(csv_file.getvalue(), mimetype='text/csv')
        response.headers.set('Content-Disposition', 'attachment', filename='inventory-export.csv')
        return response

    def history(self, inventory_id):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        try:
            return success_response(self.service.history(inventory_id, page=page, per_page=per_page))
        except ValueError as exc:
            return error_response(str(exc), 404)

    def search(self):
        search_term = request.args.get('q', '')
        warehouse_id = request.args.get('warehouse_id')
        results = self.service.search(search_term, int(warehouse_id) if warehouse_id else None)
        return success_response(results)

    def low_stock(self):
        warehouse_id = request.args.get('warehouse_id')
        results = self.service.low_stock_alerts(int(warehouse_id) if warehouse_id else None)
        return success_response(results)
