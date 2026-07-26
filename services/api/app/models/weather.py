from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel


class Weather(BaseModel):
    __tablename__ = 'weather'

    city = db.Column(db.String(100), nullable=False, index=True)
    temperature = db.Column(db.Numeric(5, 2), nullable=False)
    humidity = db.Column(db.Numeric(5, 2), nullable=False)
    weather_condition = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
