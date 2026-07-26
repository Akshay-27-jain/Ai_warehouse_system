import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import Table from "../components/ui/Table";
import type { Order, Product, Warehouse } from "../types/api";
import { orderApi, productApi, warehouseApi } from "../lib/api";

function matchesProduct(product: any, query: string) {
  const q = query.toLowerCase();
  return (
    String(product.sku || "").toLowerCase().includes(q) ||
    String(product.name || "").toLowerCase().includes(q) ||
    String(product.barcode || "").toLowerCase().includes(q) ||
    String(product.is_active || "").toLowerCase().includes(q) ||
    String(product.description || "").toLowerCase().includes(q)
  );
}

function matchesOrder(order: any, query: string) {
  const q = query.toLowerCase();
  return (
    String(order.order_number || "").toLowerCase().includes(q) ||
    String(order.payment_status || "").toLowerCase().includes(q) ||
    String(order.delivery_status || "").toLowerCase().includes(q) ||
    String(order.warehouse_id || "").toLowerCase().includes(q) ||
    String(order.notes || "").toLowerCase().includes(q)
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts([]);
      setOrders([]);
      setWarehouses([]);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [productRes, orderRes, whRes] = await Promise.allSettled([
          productApi.list({ page: "1", per_page: "50", q: debouncedQuery }),
          orderApi.list({ page: "1", per_page: "50", q: debouncedQuery }),
          warehouseApi.list({ page: "1", per_page: "50", q: debouncedQuery }),
        ]);

        if (!cancelled) {
          setProducts(productRes.status === 'fulfilled' ? (productRes.value as any).data?.items || [] : []);
          setOrders(orderRes.status === 'fulfilled' ? (orderRes.value as any).data?.items || [] : []);
          setWarehouses(whRes.status === 'fulfilled' ? (whRes.value as any).data?.items || [] : []);
        }
        const failures = [productRes, orderRes, whRes].filter(r => r.status === 'rejected').map(r => (r as any).reason?.message || 'Request failed');
        if (failures.length) setError(failures.join(' '));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    return products.filter((product) => matchesProduct(product, query));
  }, [products, query]);

  const filteredOrders = useMemo(() => {
    if (!query.trim()) return [];
    return orders.filter((order) => matchesOrder(order, query));
  }, [orders, query]);

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Global search</p>
          <h1 className="page-title">Search workspace</h1>
          <p className="page-subtitle">Find products and orders by SKU, name, barcode, payment, delivery, warehouse, or status.</p>
        </div>
      </div>

      <Card title="Search" subtitle="Type and press Enter to refresh results">
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const next = String(form.get("q") || "").trim();
            if (next) setSearchParams({ q: next });
            else setSearchParams({});
          }}
        >
          <label className="form-section search-field">
            <span className="form-label">Search term</span>
            <input className="form-input" name="q" defaultValue={query} placeholder="Try laptop, paid, delivered, or SKU" />
          </label>
          <button className="glow-btn" type="submit">Search</button>
        </form>
      </Card>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {error && (
            <div className="alert-banner">
              {error.includes("Missing token") || error.includes("401")
                ? "Your login session expired. Please login again, then search will load results."
                : error}
            </div>
          )}

          <Card title={`Products (${products.length})`} subtitle="Matching catalog records">
            {products.length === 0 ? (
              <div className="empty-state">No Results Found.</div>
            ) : (
              <Table headers={["SKU", "Name", "Barcode", "Status", "Open"]}>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{product.barcode || "No barcode"}</td>
                    <td><span className={product.is_active ? "status-pill success" : "status-pill neutral"}>{product.is_active ? "Active" : "Inactive"}</span></td>
                    <td><Link className="outline-btn table-action" to={`/products?q=${encodeURIComponent(query)}`}>View</Link></td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title={`Orders (${orders.length})`} subtitle="Matching fulfillment records">
            {orders.length === 0 ? (
              <div className="empty-state">No Results Found.</div>
            ) : (
              <Table headers={["Order", "Status", "Delivery", "Payment", "Open"]}>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.status}</td>
                    <td>{order.delivery_status || "pending"}</td>
                    <td>{order.payment_status || "unpaid"}</td>
                    <td><Link className="outline-btn table-action" to={`/orders?q=${encodeURIComponent(query)}`}>View</Link></td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title={`Warehouses (${warehouses.length})`} subtitle="Matching facilities">
            {warehouses.length === 0 ? (
              <div className="empty-state">No Results Found.</div>
            ) : (
              <Table headers={["Code", "Name", "City", "Country"]}>
                {warehouses.map((wh) => (
                  <tr key={wh.id}>
                    <td>{wh.code}</td>
                    <td>{wh.name}</td>
                    <td>{wh.city}</td>
                    <td>{wh.country}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
