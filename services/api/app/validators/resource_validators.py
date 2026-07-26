from marshmallow import Schema, fields, validate


class WarehouseSchema(Schema):
    code = fields.String(required=True, validate=validate.Length(min=2, max=50))
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    address = fields.String(load_default='')
    city = fields.String(load_default='')
    country = fields.String(load_default='')
    is_active = fields.Boolean(load_default=True)


class ProductSchema(Schema):
    sku = fields.String(required=True, validate=validate.Length(min=2, max=100))
    name = fields.String(required=True, validate=validate.Length(min=2, max=250))
    description = fields.String(load_default='')
    category_id = fields.Integer(required=True)
    supplier_id = fields.Integer(load_default=None)
    unit_cost = fields.Decimal(required=True, as_string=True)
    selling_price = fields.Decimal(required=True, as_string=True)
    is_active = fields.Boolean(load_default=True)


class OrderSchema(Schema):
    order_number = fields.String(required=True, validate=validate.Length(min=2, max=50))
    warehouse_id = fields.Integer(required=True)
    user_id = fields.Integer(required=True)
    status = fields.String(load_default='pending')
    order_date = fields.Date(required=True)
    expected_delivery_date = fields.Date(load_default=None, allow_none=True)
    delivered_at = fields.DateTime(load_default=None, allow_none=True)
    delivery_status = fields.String(load_default='pending')
    payment_status = fields.String(load_default='unpaid')
    payment_method = fields.String(load_default='not_selected')
    payment_reference = fields.String(load_default='', allow_none=True)
    notes = fields.String(load_default='')
