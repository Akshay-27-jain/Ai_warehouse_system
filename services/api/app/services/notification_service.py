from typing import Any, Dict, List, Optional, Tuple
from app.extensions import db
from app.models.notification import Notification
from datetime import datetime
from app.models.user import User
from app.services.email_service import EmailService
from app.extensions import socketio


class NotificationService:
    def create(self, payload: Dict[str, Any]) -> Notification:
        # accept `metadata` key but store as `meta` on the model
        payload = dict(payload or {})
        if 'metadata' in payload and 'meta' not in payload:
            payload['meta'] = payload.pop('metadata')
        notif = Notification(**payload)
        db.session.add(notif)
        db.session.commit()
        return notif

    def list_for_user(self, user_id: int, page: int = 1, per_page: int = 20, only_unread: bool = False) -> Tuple[List[Dict], int, int]:
        query = Notification.query.filter(Notification.recipient_id == user_id)
        if only_unread:
            query = query.filter(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = [self._serialize(n) for n in pagination.items]
        return items, pagination.total, pagination.pages

    def unread_count(self, user_id: int) -> int:
        return Notification.query.filter(Notification.recipient_id == user_id, Notification.is_read == False).count()

    def mark_read(self, notification_id: int, user_id: int) -> Dict:
        n = Notification.query.get(notification_id)
        if not n or n.recipient_id != user_id:
            raise ValueError('Not found')
        n.is_read = True
        n.updated_at = datetime.utcnow()
        db.session.commit()
        return self._serialize(n)

    def mark_all_read(self, user_id: int) -> int:
        updated = Notification.query.filter(Notification.recipient_id == user_id, Notification.is_read == False).update({ 'is_read': True })
        db.session.commit()
        return updated

    def delete(self, notification_id: int, user_id: int) -> None:
        n = Notification.query.get(notification_id)
        if not n or n.recipient_id != user_id:
            raise ValueError('Not found')
        db.session.delete(n)
        db.session.commit()

    def _serialize(self, item: Notification) -> Dict:
        return {
            'id': item.id,
            'title': item.title,
            'message': item.message,
            'is_read': bool(item.is_read),
            'link': item.link,
            'metadata': getattr(item, 'meta', None),
            'status': item.status,
            'created_at': item.created_at.isoformat() if item.created_at else None,
        }

    def create_and_notify(self, payload: Dict[str, Any], send_email: bool = True) -> Dict:
        # create notification record
        notif = self.create(payload)
        # optionally send email to recipient
        try:
            if send_email and notif.recipient_id:
                user = User.query.get(notif.recipient_id)
                if user and user.email:
                    EmailService().send_email_async(user.email, notif.title, notif.message)
        except Exception:
            pass
        # emit real-time notification via SocketIO (non-blocking)
        try:
            if notif.recipient_id:
                payload = self._serialize(notif)
                # emit to a room named by user id
                socketio.emit('notification', payload, room=f'user_{notif.recipient_id}')
        except Exception:
            # do not fail on socket emit errors
            pass
        return self._serialize(notif)
