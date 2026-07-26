from app.services.notification_service import NotificationService
from app.models.user import User
from app import create_app


def test_create_and_notify_emits(monkeypatch):
    emitted = {}

    def fake_emit(event, payload, room=None):
        emitted['event'] = event
        emitted['payload'] = payload
        emitted['room'] = room

    # patch socketio.emit in the notification_service module (already imported socketio there)
    import app.services.notification_service as ns_mod
    monkeypatch.setattr(ns_mod, 'socketio', type('S', (), {'emit': staticmethod(fake_emit)}))

    app = create_app()
    with app.app_context():
        # ensure a test user exists
        u = User.query.filter_by(email='testuser@example.com').first()
        if not u:
            u = User(username='testuser2', email='testuser2@example.com', first_name='T', last_name='U')
            u.set_password('pass1234')
            from app.extensions import db
            db.session.add(u)
            db.session.commit()
        ns = NotificationService()
        res = ns.create_and_notify({'title': 'EmitTest', 'message': 'Hello', 'recipient_id': u.id}, send_email=False)
        assert emitted.get('event') == 'notification'
        assert emitted.get('room') == f'user_{u.id}'
        assert emitted.get('payload')['title'] == 'EmitTest'
