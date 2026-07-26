import base64
import logging
import os
import smtplib
import threading
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any, Dict, Optional

from flask import current_app, has_app_context
from app.config.settings import settings
from app.extensions import db
from app.models.email import EmailLog, EmailQueue


class EmailService:
    def __init__(self):
        self.logger = logging.getLogger('app.email')

    def _get_setting(self, name: str, default: str = '') -> str:
        return os.getenv(name, default)

    def _get_int_setting(self, name: str, default: int) -> int:
        value = os.getenv(name)
        if value is None:
            return default
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _get_from_address(self) -> str:
        return (
            self._get_setting('MAIL_DEFAULT_SENDER')
            or self._get_setting('GMAIL_USER_EMAIL')
            or self._get_setting('MAIL_USERNAME')
        )

    def _smtp_configured(self) -> bool:
        return bool(
            self._get_setting('MAIL_SERVER')
            and self._get_setting('MAIL_USERNAME')
            and self._get_setting('MAIL_PASSWORD')
        )

    def _gmail_configured(self) -> bool:
        return bool(
            self._get_setting('GMAIL_CLIENT_ID')
            and self._get_setting('GMAIL_CLIENT_SECRET')
            and self._get_setting('GMAIL_REFRESH_TOKEN')
            and self._get_from_address()
        )

    def is_configured(self) -> bool:
        if has_app_context():
            return self._gmail_configured() or self._smtp_configured()
        return self._gmail_configured() or self._smtp_configured()

    def validate_configuration(self) -> Dict[str, Any]:
        if self._gmail_configured():
            errors = []
            if not settings.GMAIL_CLIENT_ID:
                errors.append('GMAIL_CLIENT_ID is required')
            if not settings.GMAIL_CLIENT_SECRET:
                errors.append('GMAIL_CLIENT_SECRET is required')
            if not settings.GMAIL_REFRESH_TOKEN:
                errors.append('GMAIL_REFRESH_TOKEN is required')
            if not self._get_from_address():
                errors.append('MAIL_DEFAULT_SENDER or GMAIL_USER_EMAIL is required')
            return {'valid': not errors, 'errors': errors}

        errors = []
        if not self._get_setting('MAIL_SERVER'):
            errors.append('MAIL_SERVER is required')
        if not self._get_setting('MAIL_USERNAME'):
            errors.append('MAIL_USERNAME is required')
        if not self._get_setting('MAIL_PASSWORD'):
            errors.append('MAIL_PASSWORD is required')
        if not self._get_setting('MAIL_DEFAULT_SENDER'):
            errors.append('MAIL_DEFAULT_SENDER is required')
        if self._get_int_setting('MAIL_PORT', 587) <= 0:
            errors.append('MAIL_PORT must be greater than 0')
        return {'valid': not errors, 'errors': errors}

    def _build_message(self, to_email: str, subject: str, html_body: Optional[str] = None, text_body: Optional[str] = None) -> EmailMessage:
        message = EmailMessage()
        message['Subject'] = subject
        message['From'] = self._get_from_address()
        message['To'] = to_email
        if html_body:
            message.set_content(text_body or 'Please view this email in an HTML-capable client.')
            message.add_alternative(html_body, subtype='html')
        else:
            message.set_content(text_body or '')
        return message

    def send_email(self, to_email: str, subject: str, body: Optional[str] = None, html_body: Optional[str] = None, event_type: str = 'generic', metadata: Optional[Dict[str, Any]] = None):
        if not self.is_configured():
            raise RuntimeError('Email is not configured. Add Gmail OAuth or SMTP email settings to .env.')

        message = self._build_message(to_email, subject, html_body=html_body, text_body=body)
        if self._gmail_configured():
            self._send_email_via_gmail_api(message)
        else:
            mail_server = self._get_setting('MAIL_SERVER')
            mail_username = self._get_setting('MAIL_USERNAME')
            mail_password = self._get_setting('MAIL_PASSWORD')
            mail_port = self._get_int_setting('MAIL_PORT', 587)
            mail_use_tls = self._get_setting('MAIL_USE_TLS', 'true').lower() == 'true'
            mail_use_ssl = self._get_setting('MAIL_USE_SSL', 'false').lower() == 'true'
            if mail_use_ssl:
                with smtplib.SMTP_SSL(mail_server, mail_port, timeout=20) as smtp:
                    smtp.login(mail_username, mail_password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(mail_server, mail_port, timeout=20) as smtp:
                    if mail_use_tls:
                        smtp.starttls()
                    smtp.login(mail_username, mail_password)
                    smtp.send_message(message)

        self._log_delivery(to_email, subject, 'sent', event_type=event_type, metadata=metadata)
        return message

    def _send_email_via_gmail_api(self, message: EmailMessage) -> None:
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
        except ImportError as exc:
            raise RuntimeError(
                'Google API client libraries are required for Gmail OAuth. '
                'Install google-api-python-client, google-auth, and google-auth-oauthlib.'
            ) from exc

        credentials = Credentials(
            token=None,
            refresh_token=self._get_setting('GMAIL_REFRESH_TOKEN'),
            token_uri=self._get_setting('GMAIL_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
            client_id=self._get_setting('GMAIL_CLIENT_ID'),
            client_secret=self._get_setting('GMAIL_CLIENT_SECRET'),
            scopes=['https://www.googleapis.com/auth/gmail.send'],
        )
        request = Request()
        credentials.refresh(request)
        service = build('gmail', 'v1', credentials=credentials)
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()

    def send_email_async(self, to_email: str, subject: str, body: Optional[str] = None, html_body: Optional[str] = None, event_type: str = 'generic', metadata: Optional[Dict[str, Any]] = None):
        if not self.is_configured():
            self.logger.warning('Attempted to send email but mail settings are not configured.')
            raise RuntimeError('Email is not configured')

        queue_item = self.queue_email(to_email, subject, body=body, html_body=html_body, event_type=event_type, metadata=metadata)
        app = current_app._get_current_object()

        def _worker():
            try:
                with app.app_context():
                    self.process_queue()
                self.logger.info('Queued email processing completed for %s', to_email)
            except Exception as exc:
                self.logger.exception('Failed to process queued email for %s: %s', to_email, exc)
                try:
                    with app.app_context():
                        self._log_delivery(to_email, subject, 'failed', event_type=event_type, metadata=metadata, error_message=str(exc))
                except Exception:
                    self.logger.exception('Failed to log failed email delivery for %s', to_email)

        thread = threading.Thread(target=_worker, daemon=True)
        thread.start()
        return queue_item

    def queue_email(self, to_email: str, subject: str, body: Optional[str] = None, html_body: Optional[str] = None, event_type: str = 'generic', metadata: Optional[Dict[str, Any]] = None):
        queue_item = EmailQueue(
            event_type=event_type,
            recipient=to_email,
            subject=subject,
            html_body=html_body,
            text_body=body,
            status='queued',
            attempts=0,
            max_attempts=3,
            next_attempt_at=datetime.now(timezone.utc),
            payload=metadata or {},
        )
        db.session.add(queue_item)
        db.session.commit()
        return queue_item

    def process_queue(self):
        pending_items = EmailQueue.query.filter(EmailQueue.status.in_(['queued', 'retrying'])).order_by(EmailQueue.created_at.asc()).all()
        now = datetime.now(timezone.utc)
        for item in pending_items:
            next_attempt = self._normalize_datetime(item.next_attempt_at)
            if next_attempt and next_attempt > now:
                continue
            if item.attempts >= item.max_attempts:
                item.status = 'failed'
                db.session.commit()
                continue
            try:
                self.send_email(item.recipient, item.subject, body=item.text_body, html_body=item.html_body, event_type=item.event_type, metadata=item.payload)
                item.status = 'sent'
                item.attempts = item.attempts + 1
                db.session.commit()
            except Exception as exc:
                item.status = 'retrying'
                item.attempts = item.attempts + 1
                item.last_error = str(exc)
                item.next_attempt_at = now
                db.session.commit()
                self.logger.exception('Failed queued email for %s: %s', item.recipient, exc)

    def _normalize_datetime(self, value):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _log_delivery(self, recipient: str, subject: str, status: str, event_type: str = 'generic', metadata: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None):
        log_entry = EmailLog(
            event_type=event_type,
            recipient=recipient,
            subject=subject,
            status=status,
            error_message=error_message,
            payload=metadata or {},
            attempts=1,
            next_attempt_at=None,
            last_attempt_at=datetime.now(timezone.utc),
            sent_at=datetime.now(timezone.utc) if status == 'sent' else None,
        )
        db.session.add(log_entry)
        db.session.commit()

    def render_template(self, template_name: str, context: Optional[Dict[str, Any]] = None) -> str:
        context = context or {}
        site_name = context.get('site_name', 'AI Warehouse')
        company = context.get('company', 'AI Warehouse Optimization System')
        logo_url = context.get('logo_url', 'https://placehold.co/160x60/0f172a/5eead4?text=AI+Warehouse')
        footer = context.get('footer', 'This message was sent by AI Warehouse Optimization System.')
        template_body = context.get('template_body', '')
        return f"""<!doctype html>
<html>
  <body style=\"font-family: Arial, sans-serif; margin: 0; background: #f4f7fb; color: #0f172a;\">
    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background: #f4f7fb; padding: 24px;\">
      <tr><td align=\"center\">
        <table role=\"presentation\" width=\"600\" style=\"max-width: 600px; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #dce7f3;\">
          <tr><td style=\"background: linear-gradient(135deg, #0f172a, #0ea5e9); padding: 24px 32px; color: white;\">
            <img src=\"{logo_url}\" alt=\"{site_name}\" style=\"height: 44px; max-width: 180px;\" />
            <h2 style=\"margin: 12px 0 4px; font-size: 24px;\">{site_name}</h2>
            <p style=\"margin: 0; opacity: 0.9;\">{company}</p>
          </td></tr>
          <tr><td style=\"padding: 32px;\">{template_body}</td></tr>
          <tr><td style=\"padding: 20px 32px 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;\">{footer}<br/>Contact: support@aiwarehouse.com</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""
