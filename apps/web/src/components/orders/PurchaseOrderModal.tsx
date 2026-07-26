import { useState } from 'react';
import { Download, FileText, Plus, Printer, Trash2, X, Building2, Calendar, ShieldAlert } from 'lucide-react';

interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SUPPLIERS = [
  { id: 1, name: 'Apex FMCG Distributors', email: 'orders@apexfmcg.com', leadDays: 3 },
  { id: 2, name: 'National Beverage Corp', email: 'supply@natbev.com', leadDays: 2 },
  { id: 3, name: 'Global Foods & Commodities', email: 'b2b@globalfoods.com', leadDays: 5 },
  { id: 4, name: 'Prime Personal Care Ltd', email: 'sales@primecare.com', leadDays: 4 },
];

const INITIAL_ITEMS: PurchaseOrderItem[] = [
  { sku: 'BEV-SPK-001', name: 'Sparkling Mineral Water 500ml', quantity: 500, unitPrice: 1.25 },
  { sku: 'FOD-NDL-008', name: 'Instant Noodles 12-Pack', quantity: 300, unitPrice: 4.50 },
  { sku: 'CAR-SHM-010', name: 'Herbal Shampoo 400ml', quantity: 200, unitPrice: 5.80 },
];

export default function PurchaseOrderModal({ isOpen, onClose }: PurchaseOrderModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState(DEFAULT_SUPPLIERS[0]);
  const [poNumber] = useState(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [targetWarehouse, setTargetWarehouse] = useState('Central Fulfillment Hub (WH-001)');
  const [deliveryDate, setDeliveryDate] = useState('2026-07-28');
  const [items, setItems] = useState<PurchaseOrderItem[]>(INITIAL_ITEMS);
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(100);
  const [newItemPrice, setNewItemPrice] = useState(2.50);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.05; // 5% GST/Tax
  const total = subtotal + tax;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([
      ...items,
      {
        sku: newItemSku.trim() || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        name: newItemName.trim(),
        quantity: newItemQty,
        unitPrice: newItemPrice,
      },
    ]);
    setNewItemSku('');
    setNewItemName('');
    setNewItemQty(100);
    setNewItemPrice(2.50);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Automated Purchase Order (PO) Generator</h3>
              <p className="text-xs text-slate-400">Restock Safety Stock & Vendor Procurement</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {showPreview ? (
          /* Formatted PO Document Preview */
          <div className="p-6 space-y-6 bg-slate-950 text-slate-100 printable-po">
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div>
                <div className="text-2xl font-black text-cyan-400 tracking-tight">AI WAREHOUSE LOGISTICS</div>
                <div className="text-xs text-slate-400 mt-1">100 Logistics Boulevard, Suite 400 • Fulfillment Hub</div>
                <div className="text-xs text-slate-400">Email: procurement@aiwarehouse.com</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-100">{poNumber}</div>
                <div className="text-xs text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</div>
                <div className="text-xs text-cyan-400 font-semibold">Target Delivery: {deliveryDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Vendor Details:</span>
                <div className="font-bold text-slate-100 text-sm">{selectedSupplier.name}</div>
                <div className="text-slate-400">{selectedSupplier.email}</div>
                <div className="text-slate-400">Estimated Lead Time: {selectedSupplier.leadDays} Days</div>
              </div>
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Ship To Warehouse:</span>
                <div className="font-bold text-slate-100 text-sm">{targetWarehouse}</div>
                <div className="text-slate-400">Attn: Inbound Logistics & Quality Dock</div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono text-cyan-400">{item.sku}</td>
                      <td className="p-3 font-semibold text-slate-200">{item.name}</td>
                      <td className="p-3 text-right font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax (5%):</span>
                  <span className="font-semibold text-slate-200">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-cyan-400">
                  <span>Total Purchase Order:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Back to Edit
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                >
                  <Printer size={14} /> Print PO
                </button>
                <button
                  onClick={() => {
                    alert(`Purchase Order ${poNumber} downloaded successfully.`);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Controls */
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Building2 size={14} className="text-cyan-400" /> Select Supplier Vendor:
                </label>
                <select
                  value={selectedSupplier.id}
                  onChange={(e) => {
                    const sup = DEFAULT_SUPPLIERS.find((s) => s.id === Number(e.target.value));
                    if (sup) setSelectedSupplier(sup);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-200 outline-none focus:border-cyan-400"
                >
                  {DEFAULT_SUPPLIERS.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.leadDays} days lead time)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Calendar size={14} className="text-cyan-400" /> Expected Delivery Date:
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-200 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Target Warehouse */}
            <div className="text-xs">
              <label className="text-slate-400 font-semibold mb-1.5 block">Delivery Destination Warehouse:</label>
              <input
                type="text"
                value={targetWarehouse}
                onChange={(e) => setTargetWarehouse(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-200 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Add item form */}
            <form onSubmit={handleAddItem} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Add Procurement SKU Item</span>
                <span className="text-cyan-400 text-[11px] flex items-center gap-1">
                  <ShieldAlert size={12} /> Auto-fill below safety stock
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="SKU (e.g. BEV-SPK-001)"
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Product Description"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none focus:border-cyan-400"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none focus:border-cyan-400"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center rounded-xl bg-cyan-500 px-3 text-slate-950 font-bold hover:bg-cyan-400"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </form>

            {/* Items list */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Line Items:</div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                    <div>
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <div className="text-cyan-400 font-mono mt-0.5">{item.sku}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-200">{item.quantity} pcs x ${item.unitPrice.toFixed(2)}</div>
                        <div className="text-cyan-400 font-bold">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="text-xs">
                <span className="text-slate-400">Total Purchase Value:</span>
                <span className="ml-2 font-bold text-cyan-400 text-base">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowPreview(true)}
                disabled={items.length === 0}
                className="rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                Generate PO Document Preview ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
