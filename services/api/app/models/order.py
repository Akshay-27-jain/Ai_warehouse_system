from app.extensions import db
from app.models.base import BaseModel


class Order(BaseModel):
    __tablename__ = 'orders'
    __table_args__ = (
        db.Index('idx_orders_wh_status', 'warehouse_id', 'status'),
        db.Index('idx_orders_user_date', 'user_id', 'order_date'),
    )

    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(30), default='pending', nullable=False, index=True)
    order_date = db.Column(db.Date, nullable=False)
    expected_delivery_date = db.Column(db.Date, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    delivery_status = db.Column(db.String(30), default='pending', nullable=False, index=True)
    payment_status = db.Column(db.String(30), default='unpaid', nullable=False, index=True)
    payment_method = db.Column(db.String(50), default='not_selected', nullable=False)
    payment_reference = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    warehouse = db.relationship('Warehouse', back_populates='orders')
    user = db.relationship('User')
    order_items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')


class OrderItem(BaseModel):
    __tablename__ = 'order_items'
    __table_args__ = (
        db.Index('idx_order_items_order_product', 'order_id', 'product_id'),
    )

    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), default=0.00, nullable=False)

    order = db.relationship('Order', back_populates='order_items')
    product = db.relationship('Product')
