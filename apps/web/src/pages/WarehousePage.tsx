import { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Table from '../components/ui/Table';
import type { Warehouse } from '../types/api';
import { warehouseApi } from '../lib/api';
import WarehouseFloorPlan from '../components/warehouse/WarehouseFloorPlan';

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', name: '', address: '', city: '', country: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const response = await warehouseApi.list({ page: '1', per_page: '20' });
      setWarehouses((response as any).data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(
    () => ({
      total: warehouses.length,
      countries: new Set(warehouses.map((warehouse) => warehouse.country || 'Unknown')).size,
      active: warehouses.length,
    }),
    [warehouses],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await warehouseApi.create(form);
      setSuccess('Warehouse created successfully.');
      setForm({ code: '', name: '', address: '', city: '', country: '' });
      await loadWarehouses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Warehouse creation failed');
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccess("");
    if (!window.confirm('Delete this warehouse? This action cannot be undone.')) return;
    try {
      await warehouseApi.delete(id);
      setSuccess('Warehouse deleted successfully.');
      await loadWarehouses();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err || 'Delete failed');
      // server may refuse deletion when inventory exists
      if (msg && msg.includes('Warehouse has inventory')) {
        if (window.confirm('This warehouse has inventory. Force delete and remove inventory records?')) {
          try {
            await warehouseApi.delete(id, { force: 'true' });
            setSuccess('Warehouse deleted with force.');
            await loadWarehouses();
            return;
          } catch (err2: any) {
            setError(err2 instanceof Error ? err2.message : String(err2 || 'Delete failed'));
            return;
          }
        }
      }
      setError(msg);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Warehouse operations</p>
          <h1 className="page-title">Facility management</h1>
          <p className="page-subtitle">Add warehouses, review locations, and keep your fulfillment network in sync.</p>
        </div>
      </div>

      <div className="section-grid section-grid-3">
        <Card title="Total facilities" className="section-panel">
          <p className="text-4xl font-semibold text-slate-100">{summary.total}</p>
          <p className="mt-3 text-sm text-slate-400">Warehouses currently registered in the platform.</p>
        </Card>
        <Card title="Active regions" className="section-panel">
          <p className="text-4xl font-semibold text-slate-100">{summary.countries}</p>
          <p className="mt-3 text-sm text-slate-400">Distinct countries covered by your warehouses.</p>
        </Card>
        <Card title="System readiness" className="section-panel">
          <p className="text-4xl font-semibold text-slate-100">{summary.active}</p>
          <p className="mt-3 text-sm text-slate-400">Facilities available for inventory and order fulfillment.</p>
        </Card>
      </div>

      <Card title="Warehouse Management" subtitle="Create and monitor warehouse facilities">
        <form onSubmit={handleSubmit} className="form-grid form-grid-2">
          {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
          {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{success}</div>}
          <label className="form-section">
            <span className="form-label">Code</span>
            <input className="form-input" placeholder="Warehouse code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </label>
          <label className="form-section">
            <span className="form-label">Name</span>
            <input className="form-input" placeholder="Warehouse name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="form-section md:col-span-2">
            <span className="form-label">Address</span>
            <input className="form-input" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <label className="form-section">
            <span className="form-label">City</span>
            <input className="form-input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="form-section">
            <span className="form-label">Country</span>
            <input className="form-input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </label>
          <button className="glow-btn md:col-span-2" type="submit">Create Warehouse</button>
        </form>
      </Card>

      <Card title="Warehouse Inventory" subtitle="Operational warehouse catalog">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="table-card">
              {warehouses.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No warehouses are available yet.</div>
            ) : (
              <Table headers={['Code', 'Name', 'City', 'Country', 'Actions']}>
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td>{warehouse.code}</td>
                    <td>{warehouse.name}</td>
                    <td>{warehouse.city}</td>
                    <td>{warehouse.country}</td>
                    <td>
                      <button className="outline-btn" onClick={() => handleDelete(Number(warehouse.id))}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        )}
      </Card>

      {/* 2D Warehouse Spatial Slotting & Heatmap Plan */}
      <WarehouseFloorPlan />
    </div>
  );
}
