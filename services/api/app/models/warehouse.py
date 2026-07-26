from app.extensions import db
from app.models.base import BaseModel


class Warehouse(BaseModel):
    __tablename__ = 'warehouses'

    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    state = db.Column(db.String(100), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    capacity = db.Column(db.Integer, default=0, nullable=False)
    current_stock = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    inventory_items = db.relationship('InventoryItem', back_populates='warehouse', lazy='dynamic')
    orders = db.relationship('Order', back_populates='warehouse', lazy='dynamic')
    transactions = db.relationship('InventoryTransaction', back_populates='warehouse', lazy='dynamic', foreign_keys='InventoryTransaction.warehouse_id')

    @property
    def warehouse_name(self):
        return self.name


class Category(BaseModel):
    __tablename__ = 'categories'

    name = db.Column(db.String(150), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)

    products = db.relationship('Product', back_populates='category', lazy='dynamic')


class Supplier(BaseModel):
    __tablename__ = 'suppliers'

    name = db.Column(db.String(200), unique=True, nullable=False, index=True)
    contact_email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    products = db.relationship('Product', back_populates='supplier', lazy='dynamic')


class Product(BaseModel):
    __tablename__ = 'products'

    sku = db.Column(db.String(100), unique=True, nullable=False, index=True)
    barcode = db.Column(db.String(150), unique=True, nullable=True, index=True)
    name = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True)
    unit_cost = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    selling_price = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)
    minimum_stock_level = db.Column(db.Integer, default=0, nullable=False)
    maximum_stock_level = db.Column(db.Integer, default=0, nullable=False)
    safety_stock = db.Column(db.Integer, default=0, nullable=False)
    alert_threshold = db.Column(db.Integer, default=0, nullable=False)
    email_alert_enabled = db.Column(db.Boolean, default=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    category = db.relationship('Category', back_populates='products')
    supplier = db.relationship('Supplier', back_populates='products')
    inventory_items = db.relationship('InventoryItem', back_populates='product', lazy='dynamic')
    transactions = db.relationship('InventoryTransaction', back_populates='product', lazy='dynamic')

    @property
    def product_name(self):
        return self.name

    @property
    def price(self):
        return float(self.selling_price)


class InventoryItem(BaseModel):
    __tablename__ = 'inventory_items'
    __table_args__ = (
        db.Index('idx_inventory_product_warehouse', 'product_id', 'warehouse_id'),
    )

    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False, index=True)
    available_quantity = db.Column(db.Integer, default=0, nullable=False)
    reserved_quantity = db.Column(db.Integer, default=0, nullable=False)
    reorder_point = db.Column(db.Integer, default=0, nullable=False)
    minimum_stock = db.Column(db.Integer, default=0, nullable=False)
    maximum_stock = db.Column(db.Integer, default=0, nullable=False)
    safety_stock = db.Column(db.Integer, default=0, nullable=False)
    alert_threshold = db.Column(db.Integer, default=0, nullable=False)
    email_alert_enabled = db.Column(db.Boolean, default=True, nullable=False)
    low_stock_threshold = db.Column(db.Integer, default=10, nullable=False)
    last_adjusted_at = db.Column(db.DateTime, nullable=True)

    product = db.relationship('Product', back_populates='inventory_items')
    warehouse = db.relationship('Warehouse', back_populates='inventory_items')
    transactions = db.relationship('InventoryTransaction', back_populates='inventory_item', lazy='dynamic')

    @property
    def quantity(self):
        return self.available_quantity


class InventoryTransaction(BaseModel):
    __tablename__ = 'inventory_transactions'
    __table_args__ = (
        db.Index('idx_transaction_prod_wh_type', 'product_id', 'warehouse_id', 'transaction_type'),
    )

    inventory_item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False, index=True)
    transaction_type = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    reference = db.Column(db.String(255), nullable=True)
    note = db.Column(db.Text, nullable=True)
    performed_by = db.Column(db.String(150), nullable=True)

    inventory_item = db.relationship('InventoryItem', back_populates='transactions')
    product = db.relationship('Product', back_populates='transactions')
    warehouse = db.relationship('Warehouse', back_populates='transactions')
