import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Eye, MoreVertical, Pencil, Trash2, Package, CheckCircle2, PauseCircle, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Table from '../components/ui/Table';
import type { Product } from '../types/api';
import { productApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, buttonPressVariants, smoothTransition } from '../animations/variants';

export default function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [form, setForm] = useState({ sku: '', name: '', description: '', category_id: '1', supplier_id: '', unit_cost: '0', selling_price: '0' });

  useEffect(() => {
    loadProducts();
  }, [query]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productApi.list({ page: '1', per_page: '50', q: query });
      setProducts((response as any).data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(
    () => ({
      total: products.length,
      active: products.filter((product) => product.is_active).length,
      inactive: products.filter((product) => !product.is_active).length,
      inventoryValue: products.reduce((sum, product) => sum + Number(product.selling_price || 0), 0),
    }),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => [
      product.sku,
      product.barcode,
      product.name,
      product.description,
      product.category_id ? `category ${product.category_id}` : '',
      product.supplier_id ? `supplier ${product.supplier_id}` : '',
      product.is_active ? 'active' : 'inactive',
    ].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [products, query]);

  const money = (value: unknown) => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const margin = (product: Product) => {
    const selling = Number(product.selling_price || 0);
    const cost = Number(product.unit_cost || 0);
    if (!selling) return '0.0%';
    return `${(((selling - cost) / selling) * 100).toFixed(1)}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await productApi.create({ ...form, category_id: Number(form.category_id), supplier_id: form.supplier_id ? Number(form.supplier_id) : null });
    setForm({ sku: '', name: '', description: '', category_id: '1', supplier_id: '', unit_cost: '0', selling_price: '0' });
    await loadProducts();
  };

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchMsg, setBatchMsg] = useState<string>('');

  const toggleSelectAll = () => {
    if (selectedIds.length === visibleProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async (action: 'pricePlus10' | 'priceMinus5' | 'toggleActive') => {
    if (selectedIds.length === 0) return;
    setBatchMsg('');

    try {
      const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
      for (const p of selectedProducts) {
        let updatedSelling = Number(p.selling_price || 0);
        let updatedActive = p.is_active;

        if (action === 'pricePlus10') {
          updatedSelling = Number((updatedSelling * 1.1).toFixed(2));
        } else if (action === 'priceMinus5') {
          updatedSelling = Number((updatedSelling * 0.95).toFixed(2));
        } else if (action === 'toggleActive') {
          updatedActive = !updatedActive;
        }

        await productApi.update(p.id, { selling_price: updatedSelling, is_active: updatedActive });
      }

      setBatchMsg(`Batch update applied to ${selectedIds.length} SKU(s) successfully.`);
      setSelectedIds([]);
      await loadProducts();
    } catch (err) {
      setBatchMsg(err instanceof Error ? err.message : 'Batch action failed');
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Product catalog</p>
          <h1 className="page-title">Catalog management</h1>
          <p className="page-subtitle">Create product listings, set pricing, and view live catalog availability.</p>
        </div>
      </div>

      <motion.div variants={staggerContainer} className="section-grid section-grid-4">
        <StatCard 
          label="Total products" 
          value={summary.total} 
          hint="Products in active catalog" 
          tone="cyan" 
          icon={<Package size={24} />} 
        />
        <StatCard 
          label="Active listings" 
          value={summary.active} 
          hint="Available for sales & order fulfillment" 
          tone="emerald" 
          icon={<CheckCircle2 size={24} />} 
        />
        <StatCard 
          label="Inactive items" 
          value={summary.inactive} 
          hint="Paused or offline products" 
          tone="rose" 
          icon={<PauseCircle size={24} />} 
        />
        <StatCard 
          label="Catalog value" 
          value={money(summary.inventoryValue)} 
          hint="Total list value of visible items" 
          tone="amber" 
          icon={<DollarSign size={24} />} 
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card title="Product Portfolio" subtitle="Manage catalog products and pricing">
          <form onSubmit={handleSubmit} className="form-grid form-grid-2">
            <label className="form-section">
              <span className="form-label">SKU</span>
              <input className="form-input" placeholder="Product SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </label>
            <label className="form-section">
              <span className="form-label">Name</span>
              <input className="form-input" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="form-section md:col-span-2">
              <span className="form-label">Description</span>
              <input className="form-input" placeholder="Product description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="form-section">
              <span className="form-label">Category ID</span>
              <input className="form-input" placeholder="Category ID" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} />
            </label>
            <label className="form-section">
              <span className="form-label">Supplier ID</span>
              <input className="form-input" placeholder="Supplier ID" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} />
            </label>
            <label className="form-section">
              <span className="form-label">Unit Cost</span>
              <input className="form-input" placeholder="Unit cost" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            </label>
            <label className="form-section">
              <span className="form-label">Selling Price</span>
              <input className="form-input" placeholder="Selling price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            </label>
            <motion.button variants={buttonPressVariants} whileHover="hover" whileTap="tap" className="glow-btn md:col-span-2" type="submit">Save Product</motion.button>
          </form>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card title="Catalog" subtitle="Product inventory and catalog visibility">
          <div className="table-tools space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="form-section search-field flex-1">
                <span className="form-label">Search catalog</span>
                <input
                  className="form-input"
                  value={query}
                  placeholder="Search by SKU, barcode, product, supplier, or status"
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next) setSearchParams({ q: next });
                    else setSearchParams({});
                  }}
                />
              </label>

              {/* Batch Action Toolbar */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-xs">
                  <span className="font-bold text-cyan-300 px-2">{selectedIds.length} Selected</span>
                  <button
                    type="button"
                    onClick={() => handleBatchAction('pricePlus10')}
                    className="rounded-xl bg-cyan-500 px-3 py-1.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    +10% Price
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchAction('priceMinus5')}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    -5% Price
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchAction('toggleActive')}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Toggle Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-slate-400 hover:text-slate-200 px-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {batchMsg && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-200">
                {batchMsg}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="table-card">
              {visibleProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No products found yet.</div>
              ) : (
                <Table headers={[
                  <input
                    type="checkbox"
                    checked={selectedIds.length === visibleProducts.length && visibleProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                    key="select-all"
                  />,
                  'SKU / Barcode',
                  'Product',
                  'Category',
                  'Supplier',
                  'Cost',
                  'Selling Price',
                  'Margin',
                  'Status',
                  'Actions'
                ]}>
                  {visibleProducts.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                      <tr key={product.id} className={isSelected ? 'bg-cyan-500/5' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(product.id)}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                          />
                        </td>
                        <td>
                          <strong>{product.sku}</strong>
                          <div className="muted-cell">{product.barcode || 'No barcode'}</div>
                        </td>
                        <td>
                          <strong>{product.name}</strong>
                          <div className="muted-cell">{product.description || 'No description'}</div>
                        </td>
                        <td>Category #{product.category_id}</td>
                        <td>{product.supplier_id ? `Supplier #${product.supplier_id}` : 'No supplier'}</td>
                        <td>{money(product.unit_cost)}</td>
                        <td>{money(product.selling_price)}</td>
                        <td><span className="status-pill success">{margin(product)}</span></td>
                        <td><span className={product.is_active ? 'status-pill success' : 'status-pill neutral'}>{product.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button table-menu-button"
                              type="button"
                              title="Product actions"
                              onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                            >
                              <MoreVertical size={18} />
                            </button>
                            {openMenuId === product.id && (
                              <div className="row-action-menu">
                                <button type="button"><Eye size={16} /> View details</button>
                                <button type="button"><Pencil size={16} /> Edit product</button>
                                <button type="button"><Copy size={16} /> Duplicate SKU</button>
                                <button type="button" className="danger"><Trash2 size={16} /> Archive</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
