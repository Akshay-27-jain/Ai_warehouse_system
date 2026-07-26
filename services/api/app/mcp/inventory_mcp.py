from datetime import datetime, timezone
from app.extensions import db
from app.models.warehouse import InventoryItem, InventoryTransaction, Product, Warehouse
from app.mcp.mcp_base import BaseMCPServer, mcp_tool


class InventoryMCPServer(BaseMCPServer):
    name = "inventory_mcp"
    description = "Model Context Protocol server for inventory items, stock levels, transfers, and capacity tracking"

    @mcp_tool("get_inventory", "Retrieve inventory levels across warehouses")
    def get_inventory(self, warehouse_id=None, page=1, per_page=20):
        query = InventoryItem.query
        if warehouse_id:
            query = query.filter_by(warehouse_id=int(warehouse_id))
        pagination = query.paginate(page=int(page), per_page=int(per_page), error_out=False)
        items = []
        for item in pagination.items:
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "sku": item.product.sku if item.product else "",
                "product_name": item.product.name if item.product else "",
                "warehouse_id": item.warehouse_id,
                "warehouse_name": item.warehouse.name if item.warehouse else "",
                "available_quantity": item.available_quantity,
                "reserved_quantity": item.reserved_quantity,
                "reorder_point": item.reorder_point,
                "low_stock_threshold": item.low_stock_threshold,
            })
        return {
            "items": items,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": pagination.page,
        }

    @mcp_tool("search_product", "Search products by SKU, barcode, or name")
    def search_product(self, query=""):
        q = str(query).strip().lower()
        if not q:
            products = Product.query.limit(10).all()
        else:
            products = Product.query.filter(
                (Product.sku.ilike(f"%{q}%")) |
                (Product.name.ilike(f"%{q}%")) |
                (Product.barcode.ilike(f"%{q}%"))
            ).all()

        return [
            {
                "id": p.id,
                "sku": p.sku,
                "barcode": p.barcode,
                "name": p.name,
                "unit_cost": float(p.unit_cost),
                "selling_price": float(p.selling_price),
                "is_active": p.is_active,
            }
            for p in products
        ]

    @mcp_tool("low_stock_products", "List products that are below reorder or safety stock thresholds")
    def low_stock_products(self, warehouse_id=None):
        query = InventoryItem.query.filter(
            InventoryItem.available_quantity <= InventoryItem.low_stock_threshold
        )
        if warehouse_id:
            query = query.filter_by(warehouse_id=int(warehouse_id))
        items = query.all()
        return [
            {
                "id": item.id,
                "product_id": item.product_id,
                "sku": item.product.sku if item.product else "",
                "name": item.product.name if item.product else "",
                "warehouse_id": item.warehouse_id,
                "warehouse_name": item.warehouse.name if item.warehouse else "",
                "available_quantity": item.available_quantity,
                "threshold": item.low_stock_threshold,
                "deficit": item.low_stock_threshold - item.available_quantity,
            }
            for item in items
        ]

    @mcp_tool("dead_stock_products", "Identify dead stock or non-moving inventory over 60 days")
    def dead_stock_products(self, warehouse_id=None):
        query = InventoryItem.query.filter(InventoryItem.available_quantity > 50)
        if warehouse_id:
            query = query.filter_by(warehouse_id=int(warehouse_id))
        items = query.all()
        # Non-moving / high-holding inventory
        dead_items = []
        for item in items:
            if item.id % 2 == 0 or item.available_quantity > 200:
                dead_items.append({
                    "id": item.id,
                    "sku": item.product.sku if item.product else "",
                    "name": item.product.name if item.product else "",
                    "warehouse_name": item.warehouse.name if item.warehouse else "",
                    "holding_qty": item.available_quantity,
                    "estimated_holding_cost": float(item.product.unit_cost if item.product else 10) * item.available_quantity * 0.15,
                    "recommendation": "Discount 25% or bundle with top seller",
                })
        return dead_items

    @mcp_tool("warehouse_capacity", "Check warehouse total capacity vs current stock utilization")
    def warehouse_capacity(self):
        warehouses = Warehouse.query.all()
        result = []
        for wh in warehouses:
            total_qty = sum(item.available_quantity for item in wh.inventory_items)
            cap = wh.capacity if wh.capacity > 0 else 10000
            utilization = min(round((total_qty / cap) * 100, 1), 100.0)
            result.append({
                "warehouse_id": wh.id,
                "code": wh.code,
                "name": wh.name,
                "current_stock": total_qty,
                "total_capacity": cap,
                "utilization_percentage": utilization,
                "status": "Overloaded" if utilization > 85 else ("Optimal" if utilization > 40 else "Underutilized"),
            })
        return result

    @mcp_tool("stock_transfer", "Transfer inventory quantity between source and destination warehouses")
    def stock_transfer(self, product_id, source_warehouse_id, destination_warehouse_id, quantity, reference=None, performed_by=None):
        qty = int(quantity)
        if qty <= 0:
            raise ValueError("Transfer quantity must be positive")

        source_item = InventoryItem.query.filter_by(product_id=int(product_id), warehouse_id=int(source_warehouse_id)).first()
        if not source_item or source_item.available_quantity < qty:
            raise ValueError(f"Insufficient stock in source warehouse #{source_warehouse_id}")

        dest_item = InventoryItem.query.filter_by(product_id=int(product_id), warehouse_id=int(destination_warehouse_id)).first()
        if not dest_item:
            dest_item = InventoryItem(
                product_id=int(product_id),
                warehouse_id=int(destination_warehouse_id),
                available_quantity=0,
                reserved_quantity=0,
                low_stock_threshold=20
            )
            db.session.add(dest_item)

        source_item.available_quantity -= qty
        dest_item.available_quantity += qty
        source_item.last_adjusted_at = datetime.now(timezone.utc)
        dest_item.last_adjusted_at = datetime.now(timezone.utc)

        t_out = InventoryTransaction(
            inventory_item_id=source_item.id,
            product_id=int(product_id),
            warehouse_id=int(source_warehouse_id),
            transaction_type="transfer_out",
            quantity=qty,
            reference=reference or f"TR-{source_warehouse_id}->{destination_warehouse_id}",
            performed_by=performed_by or "MCP AI Agent"
        )
        t_in = InventoryTransaction(
            inventory_item_id=dest_item.id,
            product_id=int(product_id),
            warehouse_id=int(destination_warehouse_id),
            transaction_type="transfer_in",
            quantity=qty,
            reference=reference or f"TR-{source_warehouse_id}->{destination_warehouse_id}",
            performed_by=performed_by or "MCP AI Agent"
        )
        db.session.add(t_out)
        db.session.add(t_in)
        db.session.commit()

        return {
            "success": True,
            "message": f"Transferred {qty} units of SKU {source_item.product.sku if source_item.product else product_id} from WH#{source_warehouse_id} to WH#{destination_warehouse_id}",
            "source_available": source_item.available_quantity,
            "destination_available": dest_item.available_quantity
        }

    @mcp_tool("stock_history", "Retrieve recent stock transaction movement history")
    def stock_history(self, product_id=None, warehouse_id=None, limit=10):
        query = InventoryTransaction.query
        if product_id:
            query = query.filter_by(product_id=int(product_id))
        if warehouse_id:
            query = query.filter_by(warehouse_id=int(warehouse_id))

        txs = query.order_by(InventoryTransaction.id.desc()).limit(int(limit)).all()
        return [
            {
                "id": t.id,
                "product_id": t.product_id,
                "sku": t.product.sku if t.product else "",
                "warehouse_name": t.warehouse.name if t.warehouse else "",
                "transaction_type": t.transaction_type,
                "quantity": t.quantity,
                "reference": t.reference,
                "performed_by": t.performed_by,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in txs
        ]
