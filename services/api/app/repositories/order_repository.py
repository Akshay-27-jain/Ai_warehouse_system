from app.repositories.base_repository import BaseRepository
from app.models.order import Order, OrderItem


class OrderRepository(BaseRepository):
    model = Order


class OrderItemRepository(BaseRepository):
    model = OrderItem
