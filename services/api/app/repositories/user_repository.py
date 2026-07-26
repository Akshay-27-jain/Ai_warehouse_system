from sqlalchemy import func
from app.repositories.base_repository import BaseRepository
from app.models.user import User, Role, Permission


class UserRepository(BaseRepository):
    model = User

    def get_by_username(self, username: str):
        if not username:
            return None
        return User.query.filter(func.lower(User.username) == username.lower()).first()

    def get_by_email(self, email: str):
        if not email:
            return None
        return User.query.filter(func.lower(User.email) == email.lower()).first()

    def get_roles(self, user: User):
        return user.roles

    def add_role(self, user: User, role: Role) -> None:
        if role not in user.roles:
            user.roles.append(role)


class RoleRepository(BaseRepository):
    model = Role


class PermissionRepository(BaseRepository):
    model = Permission
