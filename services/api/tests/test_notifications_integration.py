import pytest
from app.extensions import db
from app.models.user import User, Role
from app.models.notification import Notification
from app.services.notification_service import NotificationService
from flask_jwt_extended import create_access_token


@pytest.fixture
def app_with_data(app):
    with app.app_context():
        role = Role.query.filter_by(name='Warehouse Manager').first()
        if not role:
            role = Role(name='Warehouse Manager', description='Default role')
            db.session.add(role)
            db.session.commit()

        user = User.query.filter_by(email='testuser@example.com').first()
        if not user:
            user = User(
                username='testuser',
                email='testuser@example.com',
                first_name='Test',
                last_name='User',
                is_active=True,
            )
            user.set_password('TestPass123!')
            db.session.add(user)
            db.session.commit()

        if role not in user.roles:
            user.roles.append(role)
            db.session.commit()

        yield app, user.id

    with app.app_context():
        Notification.query.filter_by(recipient_id=user.id).delete()
        db.session.commit()
        User.query.filter_by(email='testuser@example.com').delete()
        db.session.commit()


def test_notification_crud_flow(app_with_data):
    app, user_id = app_with_data

    with app.app_context():
        ns = NotificationService()
        notif = ns.create({'title': 'Test', 'message': 'Hello', 'recipient_id': user_id})
        nid = notif.id

        items, total, pages = ns.list_for_user(user_id)
        assert any(i['id'] == nid for i in items)

        count = ns.unread_count(user_id)
        assert count >= 1

        updated = ns.mark_read(nid, user_id)
        assert updated.get('is_read') is True

        ns.delete(nid, user_id)
        items_after, _, _ = ns.list_for_user(user_id)
        assert all(i['id'] != nid for i in items_after)
