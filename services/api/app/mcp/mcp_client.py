import logging
from typing import Any, Dict, List, Optional

from app.mcp.inventory_mcp import InventoryMCPServer
from app.mcp.forecast_mcp import ForecastMCPServer
from app.mcp.analytics_mcp import AnalyticsMCPServer
from app.mcp.supplier_mcp import SupplierMCPServer
from app.mcp.database_mcp import DatabaseMCPServer
from app.mcp.weather_mcp import WeatherMCPServer
from app.mcp.notification_mcp import NotificationMCPServer

logger = logging.getLogger(__name__)


class MCPClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MCPClient, cls).__new__(cls)
            cls._instance._init_servers()
        return cls._instance

    def _init_servers(self):
        self.servers = {
            "inventory_mcp": InventoryMCPServer(),
            "forecast_mcp": ForecastMCPServer(),
            "analytics_mcp": AnalyticsMCPServer(),
            "supplier_mcp": SupplierMCPServer(),
            "database_mcp": DatabaseMCPServer(),
            "weather_mcp": WeatherMCPServer(),
            "notification_mcp": NotificationMCPServer(),
        }

    def list_all_tools(self) -> List[Dict[str, str]]:
        all_tools = []
        for server in self.servers.values():
            all_tools.extend(server.get_tools())
        return all_tools

    def call_mcp_tool(self, server_name: str, tool_name: str, **kwargs) -> Any:
        if server_name not in self.servers:
            return {
                "error": f"MCP Server '{server_name}' not registered.",
                "available_servers": list(self.servers.keys())
            }
        
        logger.info(f"Executing MCP Tool: {server_name}.{tool_name} with params={kwargs}")
        return self.servers[server_name].call_tool(tool_name, **kwargs)

    def route_query_to_mcp_tools(self, prompt: str) -> Dict[str, Any]:
        prompt_lower = str(prompt).lower()
        tool_results = []
        executed_tools = []

        # Intent Recognition Rules
        if any(w in prompt_lower for w in ["dead stock", "non moving", "expired", "holding cost"]):
            res = self.call_mcp_tool("inventory_mcp", "dead_stock_products")
            tool_results.append({"tool": "inventory_mcp.dead_stock_products", "result": res})
            executed_tools.append("inventory_mcp.dead_stock_products")

        if any(w in prompt_lower for w in ["low stock", "reorder", "alert", "stockout", "shortage"]):
            res = self.call_mcp_tool("inventory_mcp", "low_stock_products")
            tool_results.append({"tool": "inventory_mcp.low_stock_products", "result": res})
            executed_tools.append("inventory_mcp.low_stock_products")
            
            res_reorder = self.call_mcp_tool("forecast_mcp", "reorder_prediction")
            tool_results.append({"tool": "forecast_mcp.reorder_prediction", "result": res_reorder})
            executed_tools.append("forecast_mcp.reorder_prediction")

        if any(w in prompt_lower for w in ["forecast", "demand", "seasonal", "diwali", "christmas", "future"]):
            res = self.call_mcp_tool("forecast_mcp", "demand_forecast", product_id=1, days=30)
            tool_results.append({"tool": "forecast_mcp.demand_forecast", "result": res})
            executed_tools.append("forecast_mcp.demand_forecast")

            res_season = self.call_mcp_tool("forecast_mcp", "seasonal_analysis", festival="Diwali", category="Beverages")
            tool_results.append({"tool": "forecast_mcp.seasonal_analysis", "result": res_season})
            executed_tools.append("forecast_mcp.seasonal_analysis")

        if any(w in prompt_lower for w in ["capacity", "utilization", "overload", "warehouse load"]):
            res = self.call_mcp_tool("inventory_mcp", "warehouse_capacity")
            tool_results.append({"tool": "inventory_mcp.warehouse_capacity", "result": res})
            executed_tools.append("inventory_mcp.warehouse_capacity")

        if any(w in prompt_lower for w in ["revenue", "abc", "xyz", "sales", "profit", "margin"]):
            res = self.call_mcp_tool("analytics_mcp", "revenue_summary")
            tool_results.append({"tool": "analytics_mcp.revenue_summary", "result": res})
            executed_tools.append("analytics_mcp.revenue_summary")

            res_abc = self.call_mcp_tool("analytics_mcp", "abc_analysis")
            tool_results.append({"tool": "analytics_mcp.abc_analysis", "result": res_abc})
            executed_tools.append("analytics_mcp.abc_analysis")

        if any(w in prompt_lower for w in ["supplier", "vendor", "lead time", "delay", "purchase order"]):
            res = self.call_mcp_tool("supplier_mcp", "supplier_score")
            tool_results.append({"tool": "supplier_mcp.supplier_score", "result": res})
            executed_tools.append("supplier_mcp.supplier_score")

        if any(w in prompt_lower for w in ["weather", "storm", "snow", "temp"]):
            res = self.call_mcp_tool("weather_mcp", "weather_forecast", location="Chicago")
            tool_results.append({"tool": "weather_mcp.weather_forecast", "result": res})
            executed_tools.append("weather_mcp.weather_forecast")

        # Fallback to general health and inventory status if no specific intent was triggered
        if not executed_tools:
            res_health = self.call_mcp_tool("forecast_mcp", "inventory_health")
            tool_results.append({"tool": "forecast_mcp.inventory_health", "result": res_health})
            executed_tools.append("forecast_mcp.inventory_health")

            res_wh = self.call_mcp_tool("inventory_mcp", "warehouse_capacity")
            tool_results.append({"tool": "inventory_mcp.warehouse_capacity", "result": res_wh})
            executed_tools.append("inventory_mcp.warehouse_capacity")

        return {
            "executed_tools": executed_tools,
            "tool_outputs": tool_results
        }
