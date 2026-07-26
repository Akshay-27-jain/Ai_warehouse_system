import { download, request } from "./api";
import type { InventoryItem } from "../types/api";

export interface InventoryHistory {
  id: number;
  inventory_id: number;
  action: string;
  quantity: number;
  reference?: string;
  performed_by?: string;
  created_at: string;
}

export interface StockMovementPayload {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reference?: string;
  performed_by?: string;
}

export interface TransferPayload {
  product_id: number;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  quantity: number;
  reference?: string;
  performed_by?: string;
}

export interface AdjustmentPayload {
  inventory_id: number;
  quantity: number;
  reason?: string;
  performed_by?: string;
}

export const inventoryApi = {
  list(params?: Record<string, string>) {
    const cleaned: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          cleaned[k] = v;
        }
      });
    }
    const query = new URLSearchParams(cleaned).toString();

    return request<InventoryItem[]>(
      `/api/v1/inventory${query ? `?${query}` : ""}`
    );
  },

  get(id: number) {
    return request<InventoryItem>(
      `/api/v1/inventory/${id}`
    );
  },

  stockIn(payload: StockMovementPayload) {
    return request(
      "/api/v1/inventory/stock-in",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  stockOut(payload: StockMovementPayload) {
    return request(
      "/api/v1/inventory/stock-out",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  transfer(payload: TransferPayload) {
    return request(
      "/api/v1/inventory/transfer",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  adjust(payload: AdjustmentPayload) {
    return request(
      "/api/v1/inventory/adjust",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  bulkImport(
    payload: Array<Record<string, unknown>>
  ) {
    return request(
      "/api/v1/inventory/import",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  exportCsv(warehouseId?: number) {
    const params = new URLSearchParams();

    if (warehouseId) {
      params.set(
        "warehouse_id",
        warehouseId.toString()
      );
    }

    return download(
      `/api/v1/inventory/export${
        params.toString()
          ? `?${params.toString()}`
          : ""
      }`
    );
  },

  history(
    inventoryId: number,
    params?: Record<string, string>
  ) {
    const query = new URLSearchParams(
      params || {}
    ).toString();

    return request<InventoryHistory[]>(
      `/api/v1/inventory/${inventoryId}/history${
        query ? `?${query}` : ""
      }`
    );
  },

  search(
    q: string,
    warehouseId?: number
  ) {
    const params = new URLSearchParams();

    params.set("q", q);

    if (warehouseId) {
      params.set(
        "warehouse_id",
        warehouseId.toString()
      );
    }

    return request<InventoryItem[]>(
      `/api/v1/inventory/search?${params.toString()}`
    );
  },

  lowStock(
    warehouseId?: number
  ) {
    const params = new URLSearchParams();

    if (warehouseId) {
      params.set(
        "warehouse_id",
        warehouseId.toString()
      );
    }

    return request<InventoryItem[]>(
      `/api/v1/inventory/low-stock${
        params.toString()
          ? `?${params.toString()}`
          : ""
      }`
    );
  },
};