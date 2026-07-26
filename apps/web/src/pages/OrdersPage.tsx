import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, MoreVertical, Pencil, Printer, ShoppingCart, Clock, PackageCheck, CreditCard } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Table from '../components/ui/Table';
import type { Order } from '../types/api';
import { orderApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, smoothTransition } from '../animations/variants';

const paymentOptions = ['unpaid', 'authorized', 'paid', 'refunded'];
const deliveryOptions = ['pending', 'packed', 'in_transit', 'delivered', 'delayed'];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.list({ page: '1', per_page: '20' });
      setOrders((response as any).data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order: any) => order.status?.toLowerCase() === 'pending').length,
      delivered: orders.filter((order: any) => order.delivery_status?.toLowerCase() === 'delivered').length,
      paid: orders.filter((order: any) => order.payment_status?.toLowerCase() === 'paid').length,
    }),
    [orders],
  );

  const updateOrder = async (order: any, patch: Record<string, unknown>) => {
    setSavingId(order.id);
    try {
      await orderApi.update(order.id, {
        order_number: order.order_number,
        warehouse_id: order.warehouse_id,
        user_id: order.user_id,
        status: order.status,
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date || null,
        delivered_at: order.delivered_at || null,
        delivery_status: order.delivery_status || 'pending',
        payment_status: order.payment_status || 'unpaid',
        payment_method: order.payment_method || 'not_selected',
        payment_reference: order.payment_reference || '',
        notes: order.notes || '',
        ...patch,
      });
      await loadOrders();
    } finally {
      setSavingId(null);
    }
  };

  const formatLabel = (value?: string) => (value || 'not_selected').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const statusClass = (value?: string) => {
    const normalized = value?.toLowerCase();
    if (normalized === 'paid' || normalized === 'delivered') return 'status-pill success';
    if (normalized === 'authorized' || normalized === 'packed' || normalized === 'in_transit') return 'status-pill warning';
    if (normalized === 'delayed' || normalized === 'refunded') return 'status-pill danger';
    return 'status-pill neutral';
  };

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((order: any) => [
      order.order_number,
      order.status,
      order.delivery_status,
      order.payment_status,
      order.payment_method,
      order.payment_reference,
      order.notes,
      order.warehouse_id ? `warehouse ${order.warehouse_id}` : '',
    ].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [orders, query]);

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Order operations</p>
          <h1 className="page-title">Shipment and fulfillment</h1>
          <p className="page-subtitle">Track order status, dispatch readiness, and fulfillment performance across all warehouses.</p>
        </div>
      </div>

      <motion.div variants={staggerContainer} className="section-grid section-grid-4">
        <StatCard 
          label="Total orders" 
          value={summary.total} 
          hint="Orders under management" 
          tone="cyan" 
          icon={<ShoppingCart size={24} />} 
        />
        <StatCard 
          label="Pending fulfillment" 
          value={summary.pending} 
          hint="Awaiting dispatch or packing" 
          tone="amber" 
          icon={<Clock size={24} />} 
        />
        <StatCard 
          label="Delivered" 
          value={summary.delivered} 
          hint="Confirmed delivered to destination" 
          tone="emerald" 
          icon={<PackageCheck size={24} />} 
        />
        <StatCard 
          label="Paid orders" 
          value={summary.paid} 
          hint="Cleared by payment status" 
          tone="indigo" 
          icon={<CreditCard size={24} />} 
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card title="Order Operations" subtitle="Create, track, and fulfill orders">
          <div className="table-tools">
            <label className="form-section search-field">
              <span className="form-label">Search orders</span>
              <input
                className="form-input"
                value={query}
                placeholder="Search by order number, payment, delivery, warehouse, or notes"
                onChange={(event) => {
                  const next = event.target.value;
                  if (next) setSearchParams({ q: next });
                  else setSearchParams({});
                }}
              />
            </label>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="table-card">
              {visibleOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No orders found yet.</div>
              ) : (
                <Table headers={['Order #', 'Order Status', 'Delivery', 'Payment', 'Method', 'Warehouse', 'Order Date', 'Actions']}>
                  {visibleOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.order_number}</strong>
                        <div className="muted-cell">{order.notes || 'No notes'}</div>
                      </td>
                      <td><span className="status-pill neutral">{formatLabel(order.status)}</span></td>
                      <td>
                        <select
                          className={statusClass(order.delivery_status)}
                          value={order.delivery_status || 'pending'}
                          disabled={savingId === order.id}
                          onChange={(event) => updateOrder(order, {
                            delivery_status: event.target.value,
                            status: event.target.value === 'delivered' ? 'completed' : order.status,
                            delivered_at: event.target.value === 'delivered' ? new Date().toISOString() : null,
                          })}
                        >
                          {deliveryOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className={statusClass(order.payment_status)}
                          value={order.payment_status || 'unpaid'}
                          disabled={savingId === order.id}
                          onChange={(event) => updateOrder(order, { payment_status: event.target.value })}
                        >
                          {paymentOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
                        </select>
                      </td>
                      <td>{formatLabel(order.payment_method)}</td>
                      <td>Warehouse #{order.warehouse_id}</td>
                      <td>
                        {order.order_date}
                        <div className="muted-cell">ETA: {order.expected_delivery_date || 'Not set'}</div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button table-menu-button"
                            type="button"
                            title="Order actions"
                            onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openMenuId === order.id && (
                            <div className="row-action-menu">
                              <button type="button"><Eye size={16} /> View order</button>
                              <button type="button"><Pencil size={16} /> Edit order</button>
                              <button type="button"><Printer size={16} /> Print invoice</button>
                              <button
                                type="button"
                                disabled={savingId === order.id}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  updateOrder(order, {
                                    delivery_status: 'delivered',
                                    payment_status: order.payment_status === 'unpaid' ? 'paid' : order.payment_status,
                                    status: 'completed',
                                    delivered_at: new Date().toISOString(),
                                  });
                                }}
                              >
                                <CheckCircle2 size={16} /> Mark delivered
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
