from datetime import datetime
from app.extensions import db
from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = 'notifications'

    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    # who should receive this notification
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    # a short status like 'pending', 'sent', 'failed'
    status = db.Column(db.String(50), nullable=False, default='pending')
    # whether the user has read this
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    # optional link the frontend can navigate to
    link = db.Column(db.String(255), nullable=True)
    # arbitrary metadata useful for client rendering (stored in `meta` to avoid SQLAlchemy reserved name)
    meta = db.Column('meta', db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
