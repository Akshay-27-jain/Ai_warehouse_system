import { useState } from 'react';
import { Camera, CheckCircle2, QrCode, Search, X, Package, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi } from '../../lib/api';
import { inventoryApi } from '../../lib/inventoryApi';
import { backdropVariants, modalVariants } from '../../animations/variants';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (barcode: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose }: BarcodeScannerModalProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [adjustQty, setAdjustQty] = useState(10);

  const handleSimulateScan = async (codeToUse?: string) => {
    const targetBarcode = codeToUse || barcodeInput.trim();
    if (!targetBarcode) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setScannedProduct(null);

    try {
      const res: any = await productApi.list({ q: targetBarcode, per_page: '10' });
      const items = res?.data?.items || res?.items || [];
      if (items.length > 0) {
        setScannedProduct(items[0]);
      } else {
        // Fallback demo product if not found
        setScannedProduct({
          id: 999,
          sku: targetBarcode,
          name: `Scanned SKU (${targetBarcode})`,
          category: { name: 'Fast Moving FMCG' },
          unit_price: 14.99,
          current_stock: 120,
          minimum_stock_level: 25,
        });
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdjust = async (type: 'in' | 'out') => {
    if (!scannedProduct) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (type === 'in') {
        await inventoryApi.stockIn({
          warehouse_id: 1,
          product_id: scannedProduct.id || 1,
          quantity: adjustQty,
          reference: `Quick barcode scan stock-in (${scannedProduct.sku || barcodeInput})`,
        });
        setSuccessMsg(`Successfully added +${adjustQty} units to warehouse inventory.`);
      } else {
        await inventoryApi.stockOut({
          warehouse_id: 1,
          product_id: scannedProduct.id || 1,
          quantity: adjustQty,
          reference: `Quick barcode scan stock-out (${scannedProduct.sku || barcodeInput})`,
        });
        setSuccessMsg(`Successfully dispatched -${adjustQty} units from warehouse.`);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Stock adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={backdropVariants}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Barcode & QR Code Scanner</h3>
              <p className="text-xs text-slate-400">Instant SKU Lookup & Stock Adjustment</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="p-6 space-y-5">
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-500/40 bg-slate-950/60 p-6 text-center">
            <div className="relative flex h-32 w-full max-w-xs items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/5 overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              <Camera size={40} className="text-cyan-400/60" />
            </div>
            <p className="mt-3 text-xs text-slate-400">Point your handheld scanner or enter SKU barcode string below.</p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold flex-shrink-0">Presets:</span>
            {['BEV-SPK-001', 'SNK-CHO-004', 'FOD-NDL-008', 'CAR-SHM-010'].map((sku) => (
              <button
                key={sku}
                onClick={() => {
                  setBarcodeInput(sku);
                  handleSimulateScan(sku);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 flex-shrink-0"
              >
                {sku}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulateScan();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan barcode or type SKU (e.g. BEV-SPK-001)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? 'Lookup...' : 'Scan'}
            </button>
          </form>

          {/* Messages */}
          {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
          {successMsg && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2"><CheckCircle2 size={16}/>{successMsg}</div>}

          {/* Scanned product card */}
          {scannedProduct && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">{scannedProduct.name}</h4>
                    <span className="text-xs font-mono text-cyan-400">SKU: {scannedProduct.sku}</span>
                  </div>
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {scannedProduct.category?.name || 'FMCG Product'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Current Stock</span>
                  <div className="mt-0.5 text-base font-bold text-slate-100">{scannedProduct.current_stock || 120} pcs</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
                  <span className="text-slate-400">Unit Price</span>
                  <div className="mt-0.5 text-base font-bold text-cyan-400">${Number(scannedProduct.unit_price || 14.99).toFixed(2)}</div>
                </div>
              </div>

              {/* Adjust Stock Controls */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Fast Stock Adjustment Quantity:</span>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-center font-bold text-slate-100 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickAdjust('in')}
                    disabled={loading}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30"
                  >
                    + Stock In (+{adjustQty})
                  </button>
                  <button
                    onClick={() => handleQuickAdjust('out')}
                    disabled={loading}
                    className="rounded-xl border border-rose-500/40 bg-rose-500/20 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30"
                  >
                    - Stock Out (-{adjustQty})
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
