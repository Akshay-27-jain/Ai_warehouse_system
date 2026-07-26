
from flask import request
from app.extensions import db
from app.models.email import NotificationPreference
from app.services.email_service import EmailService
from app.utils.response import success_response, error_response
from app.services.notification_service import NotificationService


notification_service = NotificationService()


class NotificationController:
    def __init__(self):
        self.email_service = EmailService()
        self.notification_service = notification_service

    def get_preferences(self):
        user_id = request.current_user.id if getattr(request, 'current_user', None) else None
        if not user_id:
            return error_response('Authentication required', 401)
        preference = NotificationPreference.query.filter_by(user_id=user_id).first()
        if not preference:
            return success_response({
                'low_stock': True,
                'out_of_stock': True,
                'transfers': True,
                'reports': True,
                'orders': True,
                'ai_insights': True,
                'system_alerts': True,
            }, 'Preferences loaded', 200)
        return success_response({
            'low_stock': bool(preference.low_stock),
            'out_of_stock': bool(preference.out_of_stock),
            'transfers': bool(preference.transfers),
            'reports': bool(preference.reports),
            'orders': bool(preference.orders),
            'ai_insights': bool(preference.ai_insights),
            'system_alerts': bool(preference.system_alerts),
        }, 'Preferences loaded', 200)

    def save_preferences(self):
        user_id = request.current_user.id if getattr(request, 'current_user', None) else None
        if not user_id:
            return error_response('Authentication required', 401)
        payload = request.get_json(force=True) or {}
        preference = NotificationPreference.query.filter_by(user_id=user_id).first()
        if not preference:
            preference = NotificationPreference(user_id=user_id)
            db.session.add(preference)
        for key in ['low_stock', 'out_of_stock', 'transfers', 'reports', 'orders', 'ai_insights', 'system_alerts']:
            if key in payload:
                setattr(preference, key, bool(payload[key]))
        db.session.commit()
        return success_response(self._serialize_preferences(preference), 'Preferences saved', 200)

    def _serialize_preferences(self, preference):
        return {
            'low_stock': bool(preference.low_stock),
            'out_of_stock': bool(preference.out_of_stock),
            'transfers': bool(preference.transfers),
            'reports': bool(preference.reports),
            'orders': bool(preference.orders),
            'ai_insights': bool(preference.ai_insights),
            'system_alerts': bool(preference.system_alerts),
        }

    def test_email(self):
        payload = request.get_json(force=True) or {}
        email = (payload.get('email') or '').strip()
        preferences = payload.get('preferences') or {}

        if not email or '@' not in email:
            return error_response('A valid email address is required.', 400)

        enabled_preferences = [
            label.replace('_', ' ').title()
            for label, enabled in preferences.items()
            if enabled
        ]
        preference_text = ', '.join(enabled_preferences) if enabled_preferences else 'No alert types selected'

        # Dispatch test email or simulate dispatch in test mode
        if not self.email_service.is_configured():
            return success_response(
                {
                    'email': email,
                    'preferences': preferences,
                    'mode': 'simulated',
                },
                f'Test email notification dispatched to {email} (Demo Sandbox Mode)',
                200,
            )

        try:
            self.email_service.send_email_async(
                email,
                'AI Warehouse notification test',
                (
                    'Your AI Warehouse email notifications are ready.\n\n'
                    f'Enabled alerts: {preference_text}\n\n'
                    'You can now use this channel for low stock, order delivery, payment, and demand forecast alerts.'
                ),
            )
        except Exception as exc:
            return error_response(f'Could not enqueue test email: {exc}', 502)

        return success_response(
            {
                'email': email,
                'preferences': preferences,
            },
            f'Test email sent to {email}',
            200,
        )

    def list(self):
        # require authenticated user set by middleware
        user = getattr(request, 'current_user', None)
        if not user:
            return error_response('Authentication required', 401)
        try:
            page = int(request.args.get('page') or 1)
            per_page = int(request.args.get('per_page') or 20)
            only_unread = request.args.get('unread') == 'true'
            items, total, pages = self.notification_service.list_for_user(user.id, page=page, per_page=per_page, only_unread=only_unread)
            return success_response({'items': items, 'total': total, 'pages': pages, 'page': page, 'per_page': per_page}, 'Notifications loaded', 200)
        except Exception as exc:
            return error_response(str(exc), 400)

    def unread_count(self):
        user = getattr(request, 'current_user', None)
        if not user:
            return error_response('Authentication required', 401)
        try:
            count = self.notification_service.unread_count(user.id)
            return success_response({'unread': count}, 'Unread count', 200)
        except Exception as exc:
            return error_response(str(exc), 400)

    def mark_read(self, notification_id: int):
        user = getattr(request, 'current_user', None)
        if not user:
            return error_response('Authentication required', 401)
        try:
            item = self.notification_service.mark_read(notification_id, user.id)
            return success_response(item, 'Marked read', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)
        except Exception as exc:
            return error_response(str(exc), 400)

    def mark_all_read(self):
        user = getattr(request, 'current_user', None)
        if not user:
            return error_response('Authentication required', 401)
        try:
            updated = self.notification_service.mark_all_read(user.id)
            return success_response({'updated': updated}, 'All marked read', 200)
        except Exception as exc:
            return error_response(str(exc), 400)

    def delete(self, notification_id: int):
        user = getattr(request, 'current_user', None)
        if not user:
            return error_response('Authentication required', 401)
        try:
            self.notification_service.delete(notification_id, user.id)
            return success_response({'deleted': True}, 'Deleted', 200)
        except ValueError as exc:
            return error_response(str(exc), 404)
        except Exception as exc:
            return error_response(str(exc), 400)
