from app.extensions import db
from app.models.base import BaseModel


class DemandPrediction(BaseModel):
    __tablename__ = 'demand_predictions'

    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    predicted_quantity = db.Column(db.Integer, nullable=False)
    confidence = db.Column(db.Numeric(5, 4), default=0.0, nullable=False)
    prediction_date = db.Column(db.Date, nullable=False)

    warehouse = db.relationship('Warehouse')
    product = db.relationship('Product')
