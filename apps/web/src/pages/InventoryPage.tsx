import { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Table from '../components/ui/Table';
import type { InventoryItem, Product, Warehouse } from '../types/api';
import { inventoryApi } from '../lib/inventoryApi';
import { productApi, warehouseApi } from '../lib/api';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, buttonPressVariants, smoothTransition } from '../animations/variants';
import { Boxes, AlertTriangle, Warehouse as WarehouseIcon, Activity } from 'lucide-react';
import CsvImporterModal from '../components/ui/CsvImporterModal';


interface InventoryForm {
  product_id: number | null;
  warehouse_id: number | null;
  quantity: number;
  reference: string;
  performed_by: string;
  inventory_id: number | null;
  source_warehouse_id: number | null;
  destination_warehouse_id: number | null;
  reason: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState<InventoryForm>({
    product_id: null,
    warehouse_id: null,
    quantity: 0,
    reference: '',
    performed_by: '',
    inventory_id: null,
    source_warehouse_id: null,
    destination_warehouse_id: null,
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, whRes, prodRes, lowRes] = await Promise.allSettled([
        inventoryApi.list({ page: '1', per_page: '20', search: query, warehouse_id: selectedWarehouse }),
        warehouseApi.list({ page: '1', per_page: '50' }),
        productApi.list({ page: '1', per_page: '50' }),
        inventoryApi.lowStock(selectedWarehouse ? Number(selectedWarehouse) : undefined),
      ]);

      if (invRes.status === 'fulfilled') setItems((invRes.value as any)?.data?.items || (invRes.value as any)?.items || []);
      if (whRes.status === 'fulfilled') setWarehouses((whRes.value as any)?.data?.items || (whRes.value as any)?.items || []);
      if (prodRes.status === 'fulfilled') setProducts((prodRes.value as any)?.data?.items || (prodRes.value as any)?.items || []);
      if (lowRes.status === 'fulfilled') setLowStock((lowRes.value as any)?.data || (lowRes.value as any) || []);

      setErrorMessage('');
    } catch (err) {
      // Keep existing loaded data on transient error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query, selectedWarehouse]);

  const summary = useMemo(
    () => ({
      total: items.length,
      lowStock: lowStock.length,
      warehouses: new Set(items.map((item) => item.warehouse_id)).size,
    }),
    [items, lowStock],
  );

  const handleAction = async (action: 'stockIn' | 'stockOut' | 'adjust' | 'transfer') => {
    setErrorMessage('');
    setActionMessage('');
    try {
      switch (action) {
        case 'stockIn':
          if (!form.product_id || !form.warehouse_id || form.quantity <= 0) throw new Error('Product, warehouse and quantity are required');
          await inventoryApi.stockIn({
            product_id: form.product_id,
            warehouse_id: form.warehouse_id,
            quantity: form.quantity,
            reference: form.reference,
            performed_by: form.performed_by,
          });
          setActionMessage('Stock in recorded successfully.');
          break;
        case 'stockOut':
          if (!form.product_id || !form.warehouse_id || form.quantity <= 0) throw new Error('Product, warehouse and quantity are required');
          await inventoryApi.stockOut({
            product_id: form.product_id,
            warehouse_id: form.warehouse_id,
            quantity: form.quantity,
            reference: form.reference,
            performed_by: form.performed_by,
          });
          setActionMessage('Stock out recorded successfully.');
          break;
        case 'adjust':
          if (!form.inventory_id || form.quantity < 0) throw new Error('Inventory item and quantity are required');
          await inventoryApi.adjust({
            inventory_id: form.inventory_id,
            quantity: form.quantity,
            reason: form.reason,
            performed_by: form.performed_by,
          });
          setActionMessage('Inventory adjusted successfully.');
          break;
        case 'transfer':
          if (!form.product_id || !form.source_warehouse_id || !form.destination_warehouse_id || form.quantity <= 0) throw new Error('Product, source warehouse, destination warehouse and quantity are required');
          await inventoryApi.transfer({
            product_id: form.product_id,
            source_warehouse_id: form.source_warehouse_id,
            destination_warehouse_id: form.destination_warehouse_id,
            quantity: form.quantity,
            reference: form.reference,
            performed_by: form.performed_by,
          });
          setActionMessage('Stock transfer completed successfully.');
          break;
      }
      setForm(prev => ({ ...prev, quantity: 0, reference: '', reason: '' }));
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Inventory action failed');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setActionMessage('');
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.trim().split('\n');
      const [header, ...dataRows] = rows;
      const columns = header.split(',').map((cell) => cell.trim());
      const payload = dataRows.map((row) => {
        const values = row.split(',').map((cell) => cell.trim());
        const record: Record<string, any> = {};
        columns.forEach((col, index) => {
          record[col] = values[index] ?? '';
        });
        record.product_id = record.product_id ? Number(record.product_id) : undefined;
        record.warehouse_id = Number(record.warehouse_id);
        record.quantity = Number(record.available_quantity ?? record.quantity ?? 0);
        return record;
      });
      await inventoryApi.bulkImport(payload);
      setActionMessage('Bulk import completed successfully.');
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleExport = async () => {
    setErrorMessage('');
    setActionMessage('');
    try {
      const blob = await inventoryApi.exportCsv(selectedWarehouse ? Number(selectedWarehouse) : undefined);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'inventory-export.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setActionMessage('Inventory export downloaded.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const [activeTab, setActiveTab] = useState<'movement' | 'transfer' | 'adjustment'>('movement');

  const [csvModalOpen, setCsvModalOpen] = useState(false);

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Inventory operations</p>
          <h1 className="page-title">Inventory Management System</h1>
          <p className="page-subtitle">Track stock movements, audit inventory, and manage warehouse assignment in real time.</p>
        </div>
      </div>

      <motion.div variants={staggerContainer} className="section-grid section-grid-4">
        <StatCard 
          label="Total inventory lines" 
          value={summary.total} 
          hint="Active inventory item records" 
          tone="cyan" 
          icon={<Boxes size={24} />} 
        />
        <StatCard 
          label="Low stock alerts" 
          value={summary.lowStock} 
          hint="Items below reorder threshold" 
          tone={summary.lowStock > 0 ? "amber" : "emerald"} 
          icon={<AlertTriangle size={24} />} 
        />
        <StatCard 
          label="Warehouses online" 
          value={summary.warehouses} 
          hint="Active facilities tracking stock" 
          tone="indigo" 
          icon={<WarehouseIcon size={24} />} 
        />
        <StatCard 
          label="Real-time sync" 
          value="Live" 
          hint="Real-time API telemetry" 
          tone="emerald" 
          icon={<Activity size={24} />} 
        />
      </motion.div>

      <motion.div variants={staggerContainer} className="section-grid section-grid-2">
        <motion.div variants={staggerItem}>
          <Card title="Inventory search" subtitle="Find items by SKU, barcode, or product name">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="form-input"
                  placeholder="Search SKU, barcode, or name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="form-input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">All warehouses</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="glow-btn w-full md:w-auto" onClick={() => loadData()} type="button">Refresh inventory</motion.button>
                <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="outline-btn w-full md:w-auto" onClick={handleExport} type="button">Export CSV</motion.button>
                <motion.button
                  variants={buttonPressVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="outline-btn w-full md:w-auto"
                  onClick={() => setCsvModalOpen(true)}
                  type="button"
                >
                  Upload CSV (Drag & Drop)
                </motion.button>
              </div>
              {actionMessage && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{actionMessage}</div>}
              {errorMessage && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{errorMessage}</div>}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card title="Workflow actions" subtitle="Stock in, stock out, transfer, and adjustment">
            <div className="space-y-4">
              {/* Action Mode Tabs */}
              <div className="flex rounded-2xl border border-slate-700/80 bg-slate-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('movement')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${activeTab === 'movement' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Stock In / Out
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${activeTab === 'transfer' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Stock Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('adjustment')}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${activeTab === 'adjustment' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Adjustment
                </button>
              </div>

              {/* Tab 1: Movement */}
              {activeTab === 'movement' && (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="form-input"
                      value={form.product_id ?? ''}
                      onChange={(e) => setForm({ ...form, product_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.sku} — {product.name}</option>
                      ))}
                    </select>
                    <select
                      className="form-input"
                      value={form.warehouse_id ?? ''}
                      onChange={(e) => setForm({ ...form, warehouse_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Quantity"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                    <input
                      className="form-input"
                      placeholder="Performed by"
                      value={form.performed_by}
                      onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
                    />
                  </div>
                  <input
                    className="form-input"
                    placeholder="Reference / Batch code"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  />
                  <div className="grid gap-3 md:grid-cols-2 pt-1">
                    <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="glow-btn" type="button" onClick={() => handleAction('stockIn')}>Stock In (+)</motion.button>
                    <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="outline-btn" type="button" onClick={() => handleAction('stockOut')}>Stock Out (-)</motion.button>
                  </div>
                </div>
              )}

              {/* Tab 2: Transfer */}
              {activeTab === 'transfer' && (
                <div className="space-y-3">
                  <select
                    className="form-input"
                    value={form.product_id ?? ''}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Select product to transfer</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.sku} — {product.name}</option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="form-input"
                      value={form.source_warehouse_id ?? ''}
                      onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Source warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                    <select
                      className="form-input"
                      value={form.destination_warehouse_id ?? ''}
                      onChange={(e) => setForm({ ...form, destination_warehouse_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Destination warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="Transfer Quantity"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                    <input
                      className="form-input"
                      placeholder="Authorized by"
                      value={form.performed_by}
                      onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
                    />
                  </div>
                  <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="glow-btn w-full" type="button" onClick={() => handleAction('transfer')}>Execute Stock Transfer</motion.button>
                </div>
              )}

              {/* Tab 3: Adjustment */}
              {activeTab === 'adjustment' && (
                <div className="space-y-3">
                  <select
                    className="form-input"
                    value={form.inventory_id ?? ''}
                    onChange={(e) => setForm({ ...form, inventory_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Select inventory item record</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.sku} — {item.name} (Qty: {item.available_quantity})</option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="New Exact Quantity"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                    <input
                      className="form-input"
                      placeholder="Audited by"
                      value={form.performed_by}
                      onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
                    />
                  </div>
                  <input
                    className="form-input"
                    placeholder="Reason for adjustment (e.g. damaged, audit recount)"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                  <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="glow-btn w-full" type="button" onClick={() => handleAction('adjust')}>Save Inventory Adjustment</motion.button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card title="Inventory dashboard" subtitle="Real-time stock and alerts">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
              <Table headers={['SKU', 'Barcode', 'Name', 'Warehouse', 'Available', 'Reserved', 'Reorder', 'Low stock']}>
                {items.map((item) => (
                  <tr key={item.id} className={item.available_quantity <= item.low_stock_threshold ? 'bg-rose-500/5' : ''}>
                    <td>{item.sku}</td>
                    <td>{item.barcode || '-'}</td>
                    <td>{item.name}</td>
                    <td>{warehouses.find((warehouse) => warehouse.id === item.warehouse_id)?.name || item.warehouse_id}</td>
                    <td>{item.available_quantity}</td>
                    <td>{item.reserved_quantity}</td>
                    <td>{item.reorder_point}</td>
                    <td>{item.available_quantity <= item.low_stock_threshold ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card title="Low stock alerts" subtitle="Critical items needing restock">
          {lowStock.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No low stock alerts at this time.</div>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div key={item.id} className="rounded-3xl border border-amber-500/10 bg-amber-500/5 p-4">
                  <p className="font-semibold text-slate-100">{item.name} ({item.sku})</p>
                  <p className="text-sm text-slate-300">Warehouse: {warehouses.find((warehouse) => warehouse.id === item.warehouse_id)?.name || item.warehouse_id}</p>
                  <p className="mt-2 text-sm text-slate-400">Available: {item.available_quantity}, Threshold: {item.low_stock_threshold}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* CSV Bulk Importer Modal with Column Preview */}
      <CsvImporterModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImportComplete={(rows) => {
          setActionMessage(`Successfully parsed ${rows.length} CSV records for inventory update.`);
          loadData();
        }}
        title="Bulk Import Inventory Data"
      />

    </motion.div>
  );
}
