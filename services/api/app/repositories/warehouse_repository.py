from app.repositories.base_repository import BaseRepository
from app.models.warehouse import Warehouse, Category, Supplier, Product, InventoryItem


class WarehouseRepository(BaseRepository):
    model = Warehouse


class CategoryRepository(BaseRepository):
    model = Category


class SupplierRepository(BaseRepository):
    model = Supplier


class ProductRepository(BaseRepository):
    model = Product


class InventoryRepository(BaseRepository):
    model = InventoryItem
