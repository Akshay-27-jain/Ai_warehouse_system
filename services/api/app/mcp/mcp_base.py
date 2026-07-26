import functools
import logging
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class MCPTool:
    def __init__(self, name: str, description: str, func: Callable, server_name: str):
        self.name = name
        self.description = description
        self.func = func
        self.server_name = server_name

    def execute(self, **kwargs) -> Any:
        try:
            return self.func(**kwargs)
        except Exception as e:
            logger.error(f"Error executing MCP tool {self.server_name}.{self.name}: {e}")
            return {"error": str(e), "tool": self.name, "server": self.server_name}


class BaseMCPServer:
    name: str = "base_mcp"
    description: str = "Base Model Context Protocol Server"

    def __init__(self):
        self._tools: Dict[str, MCPTool] = {}
        self._register_decorated_tools()

    def _register_decorated_tools(self):
        for attr_name in dir(self):
            attr = getattr(self, attr_name)
            if callable(attr) and hasattr(attr, "_is_mcp_tool"):
                tool_name = getattr(attr, "_mcp_tool_name")
                tool_desc = getattr(attr, "_mcp_tool_desc")
                self._tools[tool_name] = MCPTool(
                    name=tool_name,
                    description=tool_desc,
                    func=attr,
                    server_name=self.name
                )

    def get_tools(self) -> List[Dict[str, str]]:
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "server": self.name,
            }
            for tool in self._tools.values()
        ]

    def call_tool(self, tool_name: str, **kwargs) -> Any:
        if tool_name not in self._tools:
            return {
                "error": f"Tool '{tool_name}' not found on server '{self.name}'",
                "available_tools": list(self._tools.keys())
            }
        return self._tools[tool_name].execute(**kwargs)


def mcp_tool(name: str, description: str):
    def decorator(func: Callable):
        func._is_mcp_tool = True
        func._mcp_tool_name = name
        func._mcp_tool_desc = description
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator
