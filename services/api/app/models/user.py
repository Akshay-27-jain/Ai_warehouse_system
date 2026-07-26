from datetime import datetime, timezone
import bcrypt
from werkzeug.security import check_password_hash
from app.extensions import db
from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = 'users'

    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_superuser = db.Column(db.Boolean, default=False, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verified_at = db.Column(db.DateTime, nullable=True)

    roles = db.relationship('Role', secondary='user_roles', back_populates='users', lazy='joined')
    token_blocklist = db.relationship('TokenBlocklist', back_populates='user', lazy='dynamic')

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password: str) -> bool:
        if self.password_hash and self.password_hash.startswith(('$2a$', '$2b$', '$2y$')):
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def role(self):
        return self.roles[0].name if self.roles else None

    def mark_verified(self):
        self.email_verified = True
        self.verified_at = datetime.now(timezone.utc)


class Role(BaseModel):
    __tablename__ = 'roles'

    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    users = db.relationship('User', secondary='user_roles', back_populates='roles', lazy='joined')
    permissions = db.relationship('Permission', secondary='role_permissions', back_populates='roles', lazy='joined')


class Permission(BaseModel):
    __tablename__ = 'permissions'

    code = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    roles = db.relationship('Role', secondary='role_permissions', back_populates='permissions', lazy='joined')


class TokenBlocklist(BaseModel):
    __tablename__ = 'token_blocklist'

    jti = db.Column(db.String(255), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    revoked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = db.relationship('User', back_populates='token_blocklist')


class UserRole(db.Model):
    __tablename__ = 'user_roles'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), primary_key=True)


class RolePermission(db.Model):
    __tablename__ = 'role_permissions'

    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), primary_key=True)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
