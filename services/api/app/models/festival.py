from app.extensions import db
from app.models.base import BaseModel


class Festival(BaseModel):
    __tablename__ = 'festivals'

    festival_name = db.Column(db.String(150), nullable=False, index=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
