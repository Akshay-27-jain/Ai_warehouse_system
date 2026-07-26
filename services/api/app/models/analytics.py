from app.extensions import db
from app.models.base import BaseModel


class PredictionHistory(BaseModel):
    __tablename__ = 'prediction_history'

    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    model_name = db.Column(db.String(100), nullable=False)
    prediction_type = db.Column(db.String(50), nullable=False)
    predicted_value = db.Column(db.Numeric(12, 4), nullable=False)
    confidence = db.Column(db.Numeric(5, 4), default=0.0, nullable=False)
