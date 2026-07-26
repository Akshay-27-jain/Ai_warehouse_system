"""
AI Controller for Demand Forecasting, Stock Rebalancing, and Festival AI insights.
"""
from datetime import date, timedelta
import os
import sys

from flask import request

from app.models.order import Order, OrderItem
from app.models.warehouse import InventoryItem, Product, Warehouse
from app.utils.response import error_response, success_response

# Add services directory to sys.path if not present
ai_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ai'))
if ai_path not in sys.path:
    sys.path.insert(0, ai_path)

try:
    from pipelines.demand_forecaster import DemandForecaster
    from pipelines.rebalancer import InventoryRebalancer
except ImportError:
    DemandForecaster = None
    InventoryRebalancer = None


class AIController:
    def __init__(self):
        self.forecaster = DemandForecaster() if DemandForecaster else None
        self.rebalancer = InventoryRebalancer() if InventoryRebalancer else None

    def forecast_demand(self):
        product_id = request.args.get('product_id', type=int)
        days = request.args.get('days', default=30, type=int)

        if not self.forecaster:
            return error_response('AI forecaster pipeline unavailable', 503)

        if product_id:
            items = OrderItem.query.filter_by(product_id=product_id).all()
            sales = [{'date': item.created_at.strftime('%Y-%m-%d'), 'quantity': item.quantity} for item in items]
            forecast = self.forecaster.predict_demand(product_id, sales, forecast_days=days)
            return success_response(forecast, 'Demand forecast generated')

        # Aggregate for top products
        products = Product.query.filter_by(is_active=True).limit(10).all()
        forecasts = []
        for p in products:
            items = OrderItem.query.filter_by(product_id=p.id).all()
            sales = [{'date': item.created_at.strftime('%Y-%m-%d'), 'quantity': item.quantity} for item in items]
            res = self.forecaster.predict_demand(p.id, sales, forecast_days=days)
            res['product_name'] = p.name
            forecasts.append(res)

        return success_response({'forecasts': forecasts}, 'Batch demand forecasts generated')

    def rebalance_stock(self):
        if not self.rebalancer:
            return error_response('AI rebalancer pipeline unavailable', 503)

        inventory_rows = InventoryItem.query.all()
        data = []
        for row in inventory_rows:
            data.append({
                'warehouse_id': row.warehouse_id,
                'warehouse_name': row.warehouse.name if row.warehouse else f"WH-{row.warehouse_id}",
                'product_id': row.product_id,
                'product_name': row.product.name if row.product else f"Prod-{row.product_id}",
                'available_quantity': row.available_quantity,
                'min_threshold': row.low_stock_threshold,
                'max_capacity': row.max_quantity if hasattr(row, 'max_quantity') else 500
            })

        recs = self.rebalancer.recommend_transfers(data)
        return success_response({'recommendations': recs, 'total_recommendations': len(recs)}, 'Stock rebalancing recommendations generated')

    def festival_demand(self):
        festival = request.args.get('festival', default='Diwali')
        category = request.args.get('category', default='Electronics')

        if not self.forecaster:
            return error_response('AI pipeline unavailable', 503)

        res = self.forecaster.predict_festival_demand(festival, category)
        return success_response(res, 'Festival demand insight calculated')

    def copilot_chat(self):
        try:
            data = request.get_json(force=True) or {}
            prompt = data.get('prompt', '').strip()
            if not prompt:
                return error_response('Prompt is required', 400)

            from app.services.ai_copilot_service import AICopilotService
            svc = AICopilotService()
            result = svc.process_query(prompt)
            return success_response(result, 'AI Copilot response generated')
        except Exception as exc:
            return error_response(str(exc), 500)

    def list_mcp_tools(self):
        try:
            from app.mcp.mcp_client import MCPClient
            client = MCPClient()
            tools = client.list_all_tools()
            return success_response({"tools": tools, "count": len(tools)}, 'MCP tools retrieved')
        except Exception as exc:
            return error_response(str(exc), 500)

