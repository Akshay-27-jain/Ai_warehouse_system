from marshmallow import Schema, fields, validate


class StockInSchema(Schema):
    product_id = fields.Integer(required=True, strict=True)
    warehouse_id = fields.Integer(required=True, strict=True)
    quantity = fields.Integer(required=True, strict=True, validate=validate.Range(min=1))
    reference = fields.String(load_default=None, allow_none=True)
    performed_by = fields.Integer(load_default=None, allow_none=True)


class StockOutSchema(Schema):
    product_id = fields.Integer(required=True, strict=True)
    warehouse_id = fields.Integer(required=True, strict=True)
    quantity = fields.Integer(required=True, strict=True, validate=validate.Range(min=1))
    reference = fields.String(load_default=None, allow_none=True)
    performed_by = fields.Integer(load_default=None, allow_none=True)


class AdjustSchema(Schema):
    inventory_id = fields.Integer(required=True, strict=True)
    quantity = fields.Integer(required=True, strict=True, validate=validate.Range(min=0))
    reason = fields.String(load_default=None, allow_none=True)
    performed_by = fields.Integer(load_default=None, allow_none=True)


class TransferSchema(Schema):
    product_id = fields.Integer(required=True, strict=True)
    source_warehouse_id = fields.Integer(required=True, strict=True)
    destination_warehouse_id = fields.Integer(required=True, strict=True)
    quantity = fields.Integer(required=True, strict=True, validate=validate.Range(min=1))
    reference = fields.String(load_default=None, allow_none=True)
    performed_by = fields.Integer(load_default=None, allow_none=True)


class InventoryQuerySchema(Schema):
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=100))
    sort_by = fields.String(load_default='id')
    sort_desc = fields.Boolean(load_default=False)
    search = fields.String(load_default=None)
    warehouse_id = fields.Integer(load_default=None, allow_none=True)
