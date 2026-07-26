import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, buttonPressVariants, smoothTransition } from '../animations/variants';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Table from '../components/ui/Table';
import { aiApi, productApi } from '../lib/api';
import { inventoryApi } from '../lib/inventoryApi';
import type { Product } from '../types/api';

export default function DemandPredictionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Festival simulator state
  const [festival, setFestival] = useState('Diwali');
  const [category, setCategory] = useState('Beverages');
  const [festivalResult, setFestivalResult] = useState<any>(null);
  const [festivalLoading, setFestivalLoading] = useState(false);

  // Rebalancing recommendations state
  const [rebalanceData, setRebalanceData] = useState<any[]>([]);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const [rebalanceStatus, setRebalanceStatus] = useState<string>('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res: any = await productApi.list({ per_page: '50' });
        const items = res?.data?.items || [];
        setProducts(items);
        if (items.length > 0) {
          setSelectedProduct(items[0].id);
        }
        await loadRebalance();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadForecast(selectedProduct, forecastDays);
    }
  }, [selectedProduct, forecastDays]);

  useEffect(() => {
    loadFestivalDemand();
  }, [festival, category]);

  const loadForecast = async (productId: number, days: number) => {
    setForecastLoading(true);
    try {
      const res: any = await aiApi.forecast({ product_id: productId, days });
      setForecastData(res?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadFestivalDemand = async () => {
    setFestivalLoading(true);
    try {
      const res: any = await aiApi.festivalDemand({ festival, category });
      setFestivalResult(res?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setFestivalLoading(false);
    }
  };

  const loadRebalance = async () => {
    setRebalanceLoading(true);
    try {
      const res: any = await aiApi.rebalance();
      setRebalanceData(res?.data?.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRebalanceLoading(false);
    }
  };

  const handleExecuteTransfer = async (rec: any) => {
    setRebalanceStatus('');
    try {
      await inventoryApi.transfer({
        product_id: rec.product_id,
        source_warehouse_id: rec.from_warehouse_id,
        destination_warehouse_id: rec.to_warehouse_id,
        quantity: rec.quantity,
        reference: 'AI-REBALANCE-AUTO',
      });
      setRebalanceStatus(`Stock transfer of ${rec.quantity} units executed successfully.`);
      await loadRebalance();
    } catch (err: any) {
      setRebalanceStatus(err?.message || 'Failed to execute transfer');
    }
  };

  const activeProdName = products.find((p) => p.id === selectedProduct)?.name || 'Selected Product';

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Artificial Intelligence & Predictive Analytics</p>
          <h1 className="page-title flex items-center gap-3">
            <BrainCircuit className="text-indigo-400" size={32} /> Demand Forecasting & AI Rebalancing
          </h1>
          <p className="page-subtitle">
            Statistical demand predictions, seasonal festival multipliers, and real-time inventory rebalancing optimizations.
          </p>
        </div>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={loadRebalance} disabled={rebalanceLoading}>
          <RefreshCw size={18} className={rebalanceLoading ? 'animate-spin' : ''} />
          Refresh AI Models
        </button>
      </div>

      {/* Grid: Forecast Calculator & Festival Simulator */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Product Demand Predictor */}
        <motion.div variants={staggerItem}>
          <Card title="Product Demand Forecasting" subtitle="Predict sales and calculate safety stock bounds" icon={<TrendingUp size={22} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-section">
                <span className="form-label">Select FMCG Product</span>
                <select className="form-input" value={selectedProduct || ''} onChange={(e) => setSelectedProduct(Number(e.target.value))}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-section">
                <span className="form-label">Forecast Period</span>
                <select className="form-input" value={forecastDays} onChange={(e) => setForecastDays(Number(e.target.value))}>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </label>
            </div>

            {forecastLoading ? (
              <LoadingSkeleton rows={4} />
            ) : forecastData ? (
              <div className="space-y-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Daily Avg</span>
                    <strong className="text-xl text-indigo-400">{forecastData.avg_daily_demand} units</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Predicted Demand</span>
                    <strong className="text-xl text-emerald-400">{forecastData.predicted_total_demand} units</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">95% Conf. Range</span>
                    <strong className="text-sm text-slate-300">
                      {forecastData.confidence_interval?.lower} - {forecastData.confidence_interval?.upper}
                    </strong>
                  </div>
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Safety Stock</span>
                    <strong className="text-xl text-amber-400">{forecastData.recommended_safety_stock} units</strong>
                  </div>
                </div>

                <div className="p-4 bg-indigo-950/30 rounded-lg border border-indigo-800/30 flex items-start gap-3">
                  <Sparkles size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-200">
                    AI confidence score is <strong>{Math.round((forecastData.confidence_score || 0.85) * 100)}%</strong> for{' '}
                    <em>{activeProdName}</em> over {forecastDays} days.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          </Card>
        </motion.div>

        {/* Card 2: Festival Demand Simulator */}
        <motion.div variants={staggerItem}>
          <Card title="Festival & Peak Demand Simulator" subtitle="Estimate demand lift during seasonal festivals" icon={<Calendar size={22} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-section">
                <span className="form-label">Festival Season</span>
                <select className="form-input" value={festival} onChange={(e) => setFestival(e.target.value)}>
                  <option value="Diwali">Diwali (Peak Season)</option>
                  <option value="Christmas">Christmas & New Year</option>
                  <option value="Black_Friday">Black Friday / Cyber Week</option>
                  <option value="Eid">Eid al-Fitr</option>
                </select>
              </label>

              <label className="form-section">
                <span className="form-label">Category</span>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Beverages">Beverages</option>
                  <option value="Packaged Foods">Packaged Foods</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Household & Cleaning">Household & Cleaning</option>
                  <option value="Electronics & Home">Electronics & Home</option>
                </select>
              </label>
            </div>

            {festivalLoading ? (
              <LoadingSkeleton rows={4} />
            ) : festivalResult ? (
              <div className="space-y-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
                <div className="grid grid-cols-3 gap-4">
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Demand Multiplier</span>
                    <strong className="text-2xl text-amber-400">{festivalResult.demand_lift_multiplier}x</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Expected Lift</span>
                    <strong className="text-2xl text-emerald-400">+{festivalResult.expected_increase_percent}%</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="text-xs text-slate-400">Target Safety Stock</span>
                    <strong className="text-2xl text-indigo-400">{festivalResult.recommended_stock_level} units</strong>
                  </div>
                </div>

                <div className="p-4 bg-amber-950/30 rounded-lg border border-amber-800/30 flex items-start gap-3">
                  <Zap size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">{festivalResult.advice}</p>
                </div>
              </div>
            ) : null}
          </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Rebalancing Recommendations Table */}
      <motion.div variants={staggerItem}>
        <Card title="AI Inventory Rebalancing Engine" subtitle="Automated stock transfers to eliminate stockouts and balance warehouse utilization" icon={<ArrowRightLeft size={22} />}>
        {rebalanceStatus && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{rebalanceStatus}</span>
          </div>
        )}

        {rebalanceLoading ? (
          <LoadingSkeleton rows={5} />
        ) : rebalanceData.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No warehouse stock imbalances detected right now.</div>
        ) : (
          <Table headers={['Product', 'From Warehouse', 'To Warehouse', 'Transfer Qty', 'Est. Cost', 'Priority', 'Action']}>
            {rebalanceData.map((rec, idx) => (
              <tr key={idx}>
                <td>
                  <strong>{rec.product_name}</strong>
                  <div className="text-xs text-slate-400">SKU #{rec.product_id}</div>
                </td>
                <td>{rec.from_warehouse_name}</td>
                <td>{rec.to_warehouse_name}</td>
                <td>
                  <strong className="text-indigo-400">{rec.quantity} units</strong>
                </td>
                <td>${rec.estimated_cost}</td>
                <td>
                  <span className={`status-pill ${rec.priority === 'High' ? 'danger' : 'warning'}`}>{rec.priority} Priority</span>
                </td>
                <td>
                  <button type="button" className="btn-primary table-action flex items-center gap-1" onClick={() => handleExecuteTransfer(rec)}>
                    <PackageCheck size={14} /> Execute Transfer
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
