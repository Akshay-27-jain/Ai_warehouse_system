from datetime import datetime, timezone
from app.extensions import db
from app.models.base import BaseModel


class EmailLog(BaseModel):
    __tablename__ = 'email_logs'

    event_type = db.Column(db.String(80), nullable=False, index=True)
    recipient = db.Column(db.String(255), nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(30), nullable=False, default='queued', index=True)
    error_message = db.Column(db.Text, nullable=True)
    payload = db.Column('metadata', db.JSON, nullable=True)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    next_attempt_at = db.Column(db.DateTime, nullable=True)
    last_attempt_at = db.Column(db.DateTime, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)


class EmailQueue(BaseModel):
    __tablename__ = 'email_queue'

    event_type = db.Column(db.String(80), nullable=False, index=True)
    recipient = db.Column(db.String(255), nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=True)
    html_body = db.Column(db.Text, nullable=True)
    text_body = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), nullable=False, default='queued', index=True)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    max_attempts = db.Column(db.Integer, nullable=False, default=3)
    next_attempt_at = db.Column(db.DateTime, nullable=True)
    last_error = db.Column(db.Text, nullable=True)
    payload = db.Column('metadata', db.JSON, nullable=True)


class NotificationPreference(BaseModel):
    __tablename__ = 'notification_preferences'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True, unique=True)
    low_stock = db.Column(db.Boolean, default=True, nullable=False)
    out_of_stock = db.Column(db.Boolean, default=True, nullable=False)
    transfers = db.Column(db.Boolean, default=True, nullable=False)
    reports = db.Column(db.Boolean, default=True, nullable=False)
    orders = db.Column(db.Boolean, default=True, nullable=False)
    ai_insights = db.Column(db.Boolean, default=True, nullable=False)
    system_alerts = db.Column(db.Boolean, default=True, nullable=False)


class PasswordResetToken(BaseModel):
    __tablename__ = 'password_reset_tokens'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    used_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)


class AppSetting(BaseModel):
    __tablename__ = 'app_settings'

    setting_key = db.Column(db.String(100), nullable=False, unique=True, index=True)
    setting_value = db.Column(db.Text, nullable=True)
    setting_type = db.Column(db.String(30), nullable=False, default='string')
    description = db.Column(db.Text, nullable=True)
    is_encrypted = db.Column(db.Boolean, nullable=False, default=False)
