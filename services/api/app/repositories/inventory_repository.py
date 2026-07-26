from typing import Any, Optional, Tuple
from sqlalchemy import or_
from app.extensions import db
from app.models.warehouse import InventoryItem, Product
from app.repositories.base_repository import BaseRepository


class InventoryRepository(BaseRepository):
    model = InventoryItem

    def get_by_product_and_warehouse(self, product_id: int, warehouse_id: int) -> Optional[InventoryItem]:
        return self.model.query.filter_by(product_id=product_id, warehouse_id=warehouse_id).first()

    def find_by_sku_or_barcode(self, search_term: str, warehouse_id: Optional[int] = None):
        query = self.model.query.join(Product).filter(
            or_(Product.sku.ilike(f'%{search_term}%'), Product.barcode.ilike(f'%{search_term}%'), Product.name.ilike(f'%{search_term}%'))
        )
        if warehouse_id:
            query = query.filter(self.model.warehouse_id == warehouse_id)
        return query.all()

    def get_low_stock(self, warehouse_id: Optional[int] = None):
        query = self.model.query.filter(self.model.available_quantity <= self.model.low_stock_threshold)
        if warehouse_id:
            query = query.filter(self.model.warehouse_id == warehouse_id)
        return query.all()

    def list_inventory(self, filters=None, sort_by=None, sort_desc=False, page=1, per_page=20):
        query = self.model.query.join(Product).join(InventoryItem.warehouse)
        if filters:
            if filters.get('search'):
                query = query.filter(
                    or_(
                        Product.sku.ilike(f"%{filters['search']}%"),
                        Product.barcode.ilike(f"%{filters['search']}%"),
                        Product.name.ilike(f"%{filters['search']}%"),
                    )
                )
            if filters.get('warehouse_id'):
                query = query.filter(self.model.warehouse_id == filters['warehouse_id'])
        if sort_by and hasattr(self.model, sort_by):
            column = getattr(self.model, sort_by)
            query = query.order_by(column.desc() if sort_desc else column.asc())
        else:
            query = query.order_by(self.model.id.asc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return pagination.items, pagination.total, pagination.pages
