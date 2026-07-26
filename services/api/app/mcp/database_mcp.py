import re
from sqlalchemy import text
from app.extensions import db
from app.mcp.mcp_base import BaseMCPServer, mcp_tool


class DatabaseMCPServer(BaseMCPServer):
    name = "database_mcp"
    description = "Model Context Protocol server for safe read-only SQL queries against warehouse database tables"

    def _validate_read_only(self, sql: str):
        cleaned = str(sql).strip().upper()
        forbidden_keywords = ["DELETE", "DROP", "UPDATE", "ALTER", "INSERT", "TRUNCATE", "CREATE", "REPLACE", "GRANT", "REVOKE"]
        for kw in forbidden_keywords:
            if re.search(r'\b' + kw + r'\b', cleaned):
                raise PermissionError(f"Security Alert: Executing '{kw}' statements is forbidden on read-only Database MCP.")
        if not cleaned.startswith("SELECT") and not cleaned.startswith("WITH"):
            raise PermissionError("Security Alert: Database MCP accepts only SELECT or WITH queries.")

    @mcp_tool("inventory_query", "Execute safe read-only SQL query against inventory items and products")
    def inventory_query(self, sql_query=None, limit=20):
        if not sql_query:
            sql_query = "SELECT p.sku, p.name, i.available_quantity, i.warehouse_id FROM inventory_items i JOIN products p ON i.product_id = p.id LIMIT 10"

        self._validate_read_only(sql_query)
        result = db.session.execute(text(sql_query))
        keys = result.keys()
        rows = [dict(zip(keys, row)) for row in result.fetchall()]
        return {
            "query_executed": sql_query,
            "row_count": len(rows),
            "data": rows[:int(limit)]
        }

    @mcp_tool("sales_query", "Execute safe read-only SQL query against orders and sales statistics")
    def sales_query(self, sql_query=None, limit=20):
        if not sql_query:
            sql_query = "SELECT order_number, status, delivery_status, payment_status, order_date FROM orders ORDER BY id DESC LIMIT 10"

        self._validate_read_only(sql_query)
        result = db.session.execute(text(sql_query))
        keys = result.keys()
        rows = [dict(zip(keys, row)) for row in result.fetchall()]
        return {
            "query_executed": sql_query,
            "row_count": len(rows),
            "data": rows[:int(limit)]
        }

    @mcp_tool("warehouse_query", "Execute safe read-only SQL query against warehouses and capacity utilization")
    def warehouse_query(self, sql_query=None, limit=20):
        if not sql_query:
            sql_query = "SELECT code, name, city, country, capacity FROM warehouses LIMIT 10"

        self._validate_read_only(sql_query)
        result = db.session.execute(text(sql_query))
        keys = result.keys()
        rows = [dict(zip(keys, row)) for row in result.fetchall()]
        return {
            "query_executed": sql_query,
            "row_count": len(rows),
            "data": rows[:int(limit)]
        }
