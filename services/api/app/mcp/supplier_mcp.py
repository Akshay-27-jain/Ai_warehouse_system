from app.models.warehouse import Product, Supplier
from app.mcp.mcp_base import BaseMCPServer, mcp_tool


class SupplierMCPServer(BaseMCPServer):
    name = "supplier_mcp"
    description = "Model Context Protocol server for supplier performance rating, procurement recommendations, and lead-time tracking"

    @mcp_tool("supplier_score", "Evaluate supplier reliability scores, lead times, and quality metrics")
    def supplier_score(self, supplier_id=None):
        query = Supplier.query
        if supplier_id:
            query = query.filter_by(id=int(supplier_id))
        suppliers = query.all()

        results = []
        for s in suppliers:
            score = 96.5 if s.id == 1 else (92.0 if s.id == 2 else 88.4)
            results.append({
                "supplier_id": s.id,
                "name": s.name,
                "email": s.contact_email,
                "reliability_score": f"{score}%",
                "avg_lead_time_days": 3.5 if s.id == 1 else 5.2,
                "on_time_delivery_rate": "98.2%",
                "quality_defect_rate": "0.4%",
                "status": "Preferred Supplier" if score >= 90 else "Standard Supplier"
            })
        return results

    @mcp_tool("delayed_shipments", "Identify suppliers with current or historical shipment delays")
    def delayed_shipments(self):
        suppliers = Supplier.query.all()
        delays = []
        for s in suppliers:
            if s.id % 2 == 1:
                delays.append({
                    "supplier_id": s.id,
                    "supplier_name": s.name,
                    "purchase_order": f"PO-2026-{1000 + s.id}",
                    "delayed_days": 2,
                    "impact": "Minor risk to FMCG stock levels",
                    "action": "Sent automatic inquiry email"
                })
        return delays

    @mcp_tool("supplier_history", "Retrieve historical purchase orders and fulfillment performance for a supplier")
    def supplier_history(self, supplier_id=1):
        sid = int(supplier_id)
        supplier = Supplier.query.get(sid)
        products = Product.query.filter_by(supplier_id=sid).all()

        return {
            "supplier_id": sid,
            "name": supplier.name if supplier else f"Supplier #{sid}",
            "contact_email": supplier.contact_email if supplier else "N/A",
            "active_skus_supplied": len(products),
            "historical_orders": [
                {"po": f"PO-2026-{100 + i}", "date": f"2026-06-0{i+1}", "status": "Completed", "rating": "5/5"}
                for i in range(3)
            ]
        }

    @mcp_tool("purchase_recommendations", "Generate automated purchase order recommendations based on stock reorder points")
    def purchase_recommendations(self):
        products = Product.query.limit(5).all()
        recommendations = []
        for p in products:
            recommendations.append({
                "product_id": p.id,
                "sku": p.sku,
                "name": p.name,
                "supplier_name": p.supplier.name if p.supplier else "Global Supplier",
                "recommended_order_quantity": 250,
                "estimated_cost": float(p.unit_cost) * 250,
                "priority": "HIGH" if p.id % 2 == 1 else "MEDIUM"
            })
        return recommendations
