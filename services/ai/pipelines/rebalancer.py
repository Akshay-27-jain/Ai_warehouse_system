"""
Inventory Rebalancing Engine module.
Calculates stock transfer recommendations between overloaded and underutilized warehouses.
"""
import math


class InventoryRebalancer:
    def recommend_transfers(self, warehouse_inventories, transfer_cost_per_unit=2.5):
        """
        warehouse_inventories: list of dicts:
        [{
            'warehouse_id': int,
            'warehouse_name': str,
            'product_id': int,
            'product_name': str,
            'available_quantity': int,
            'min_threshold': int,
            'max_capacity': int
        }]
        """
        recommendations = []
        if not warehouse_inventories:
            return recommendations

        # Group by product_id
        product_map = {}
        for item in warehouse_inventories:
            p_id = item['product_id']
            if p_id not in product_map:
                product_map[p_id] = []
            product_map[p_id].append(item)

        for p_id, items in product_map.items():
            if len(items) < 2:
                continue

            surplus_warehouses = []
            deficit_warehouses = []

            for item in items:
                available = item['available_quantity']
                target = item.get('min_threshold', 10) * 2

                if available > target + 15:
                    surplus_warehouses.append({
                        'item': item,
                        'excess': available - target
                    })
                elif available < item.get('min_threshold', 10):
                    deficit_warehouses.append({
                        'item': item,
                        'needed': target - available
                    })

            for s in surplus_warehouses:
                for d in deficit_warehouses:
                    if s['excess'] <= 0 or d['needed'] <= 0:
                        continue

                    transfer_qty = min(s['excess'], d['needed'])
                    if transfer_qty <= 0:
                        continue

                    est_cost = round(transfer_qty * transfer_cost_per_unit, 2)
                    recommendations.append({
                        'product_id': p_id,
                        'product_name': s['item']['product_name'],
                        'from_warehouse_id': s['item']['warehouse_id'],
                        'from_warehouse_name': s['item']['warehouse_name'],
                        'to_warehouse_id': d['item']['warehouse_id'],
                        'to_warehouse_name': d['item']['warehouse_name'],
                        'quantity': transfer_qty,
                        'estimated_cost': est_cost,
                        'priority': 'High' if d['item']['available_quantity'] <= 5 else 'Medium',
                        'reason': f"Rebalance stock to prevent stockout at {d['item']['warehouse_name']}."
                    })

                    s['excess'] -= transfer_qty
                    d['needed'] -= transfer_qty

        return recommendations
