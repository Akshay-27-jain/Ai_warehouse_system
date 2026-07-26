import pytest
from app.mcp.mcp_client import MCPClient
from app.mcp.database_mcp import DatabaseMCPServer


def test_mcp_client_tool_registration():
    client = MCPClient()
    tools = client.list_all_tools()
    assert len(tools) >= 20
    
    server_names = set(t["server"] for t in tools)
    expected_servers = {
        "inventory_mcp",
        "forecast_mcp",
        "analytics_mcp",
        "supplier_mcp",
        "database_mcp",
        "weather_mcp",
        "notification_mcp"
    }
    assert expected_servers.issubset(server_names)


def test_database_mcp_read_only_safety():
    db_mcp = DatabaseMCPServer()

    # Valid SELECT query should pass validation
    db_mcp._validate_read_only("SELECT * FROM inventory_items WHERE available_quantity < 10")

    # Forbidden mutation statements must raise PermissionError
    with pytest.raises(PermissionError):
        db_mcp._validate_read_only("DELETE FROM inventory_items WHERE id = 1")

    with pytest.raises(PermissionError):
        db_mcp._validate_read_only("DROP TABLE products")

    with pytest.raises(PermissionError):
        db_mcp._validate_read_only("UPDATE inventory_items SET available_quantity = 999 WHERE id = 1")

    with pytest.raises(PermissionError):
        db_mcp._validate_read_only("ALTER TABLE warehouses ADD COLUMN dummy text")


def test_mcp_query_routing():
    client = MCPClient()
    
    # Test low stock prompt routing
    res = client.route_query_to_mcp_tools("Show low stock items and reorder dates")
    assert "inventory_mcp.low_stock_products" in res["executed_tools"]

    # Test dead stock prompt routing
    res_dead = client.route_query_to_mcp_tools("Identify dead stock inventory")
    assert "inventory_mcp.dead_stock_products" in res_dead["executed_tools"]

    # Test demand forecast prompt routing
    res_forecast = client.route_query_to_mcp_tools("Calculate 30-day demand forecast")
    assert "forecast_mcp.demand_forecast" in res_forecast["executed_tools"]
