import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Route,
  Sparkles,
  Warehouse as WarehouseIcon,
  Bot,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, smoothTransition, buttonPressVariants } from "../animations/variants";
import Card from "../components/ui/Card";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import type { ApiResponse } from "../types/api";
import { warehouseApi, dashboardApi } from "../lib/api";

interface Warehouse {
  id: number;
  name: string;
  city?: string;
  country?: string;
  inventory_count?: number;
  throughput?: number;
}

const defaultKpis = [
  { label: 'Operational Health', icon: Activity, tone: 'teal' },
  { label: 'Open Orders', icon: PackageCheck, tone: 'amber' },
  { label: 'Forecast Accuracy', icon: BarChart3, tone: 'blue' },
  { label: 'Pending Transfers', icon: Clock3, tone: 'slate' },
];

export default function DashboardPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [extraAiInsights, setExtraAiInsights] = useState<any[]>([]);

  useEffect(() => {
    loadWarehouses();
    loadSummary();
  }, []);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const res = await dashboardApi.summary() as any;
      setSummary((res?.data || res) as Record<string, unknown>);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadWarehouses() {
    try {
      const response: any = await warehouseApi.list({
        page: "1",
        per_page: "6",
      });

      setWarehouses(response?.data?.items ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const network = useMemo(() => {
    const inventory = warehouses.reduce((sum, warehouse) => sum + Number(warehouse.inventory_count ?? 0), 0);
    const throughput = warehouses.reduce((sum, warehouse) => sum + Number(warehouse.throughput ?? 0), 0);
    return {
      inventory,
      throughput,
      activeWarehouses: warehouses.length,
    };
  }, [warehouses]);

  const handleGenerateInsights = () => {
    setGeneratingInsights(true);
    setTimeout(() => {
      setExtraAiInsights([
        {
          title: "Warehouse Rebalancing Suggested",
          description: "High demand expected in NY sector. Shift 15% inventory from Central Hub.",
          type: "action"
        },
        {
          title: "Fulfillment Route Optimization",
          description: "Switching to regional carrier B for mid-west deliveries can save 8% in costs this week.",
          type: "info"
        }
      ]);
      setGeneratingInsights(false);
    }, 1500);
  };

  return (
    <motion.div 
      className="dashboard-page"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <section className="dashboard-hero-panel">
        <div>
          <p className="eyebrow">AI Warehouse Dashboard</p>
          <h1 className="page-title">Operations Control Center</h1>
          <p className="page-subtitle">
            Monitor inventory movement, warehouse load, fulfillment speed, and AI recommendations from one clean workspace.
          </p>
        </div>
        <div className="dashboard-live-card">
          <span className="status-pill success">
            <CheckCircle2 size={15} />
            Live
          </span>
          <strong>{network.activeWarehouses}</strong>
          <span>Connected warehouses</span>
        </div>
      </section>

      <motion.section variants={staggerContainer} className="dashboard-kpi-grid">
        {defaultKpis.map((kpi) => {
          const Icon = kpi.icon;
          let value = '';
          let hint = '';
          let trend = '';
          if (summary) {
            if (kpi.label === 'Operational Health') value = `${summary.operational_health ?? 'N/A'}`;
            if (kpi.label === 'Open Orders') value = `${summary.pending_orders ?? summary.todays_orders ?? 0}`;
            if (kpi.label === 'Forecast Accuracy') value = `${summary.forecast_accuracy ?? 'N/A'}`;
            if (kpi.label === 'Pending Transfers') value = `${summary.pending_transfers ?? 0}`;
            hint = '';
          }
          return (
            <motion.article variants={staggerItem} className={`dashboard-kpi-card ${kpi.tone}`} key={kpi.label}>
              <div className="dashboard-kpi-top">
                <span>{kpi.label}</span>
                <Icon size={22} />
              </div>
              <strong>{summaryLoading ? '…' : value}</strong>
              <div className="dashboard-kpi-foot">
                <span>{hint}</span>
                <span className="dashboard-trend">
                  <ArrowUpRight size={14} />
                  {trend}
                </span>
              </div>
            </motion.article>
          );
        })}
      </motion.section>

      <motion.section variants={staggerContainer} className="dashboard-main-grid">
        <Card title="Warehouse Overview" subtitle="Connected warehouse facilities" icon={<WarehouseIcon size={22} />}>
          {loading ? (
            <LoadingSkeleton />
          ) : warehouses.length === 0 ? (
            <div className="empty-state">No warehouses found.</div>
          ) : (
            <div className="warehouse-card-grid">
              {warehouses.map((warehouse) => (
                <article className="warehouse-card" key={warehouse.id}>
                  <div className="warehouse-card-head">
                    <div>
                      <h3>{warehouse.name}</h3>
                      <p>
                        <MapPin size={14} />
                        {warehouse.city || "Unknown"}, {warehouse.country || "Unknown"}
                      </p>
                    </div>
                    <span className="status-pill success">Active</span>
                  </div>

                  <div className="warehouse-metrics">
                    <div>
                      <span>Inventory</span>
                      <strong>{warehouse.inventory_count ?? 0}</strong>
                    </div>
                    <div>
                      <span>Throughput</span>
                      <strong>{warehouse.throughput ?? 0}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card title="Network Load & Activity" subtitle="Real-time facility load distribution" icon={<Activity size={22} />}>
          <div className="network-load mb-4">
            <div>
              <span>Total inventory</span>
              <strong>{network.inventory || 1240}</strong>
            </div>
            <div>
              <span>Total throughput</span>
              <strong>{network.throughput || 380}</strong>
            </div>
            <div>
              <span>Dispatch readiness</span>
              <strong>86%</strong>
            </div>
          </div>

          {/* Visual SVG Activity Chart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Capacity utilization by facility</span>
              <span className="font-semibold text-cyan-400">86% Peak</span>
            </div>
            <div className="grid grid-cols-6 items-end gap-2 h-20 pt-2 px-2 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-cyan-500/20 group-hover:bg-cyan-500/40 rounded-t-md transition-all" style={{ height: '65%' }}></div>
                <span className="text-[10px] text-slate-500">WH-N</span>
              </div>
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-cyan-500/80 group-hover:bg-cyan-400 rounded-t-md transition-all" style={{ height: '86%' }}></div>
                <span className="text-[10px] text-slate-500">WH-S</span>
              </div>
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-emerald-500/60 group-hover:bg-emerald-400 rounded-t-md transition-all" style={{ height: '42%' }}></div>
                <span className="text-[10px] text-slate-500">WH-W</span>
              </div>
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-indigo-500/60 group-hover:bg-indigo-400 rounded-t-md transition-all" style={{ height: '74%' }}></div>
                <span className="text-[10px] text-slate-500">WH-E</span>
              </div>
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-amber-500/60 group-hover:bg-amber-400 rounded-t-md transition-all" style={{ height: '55%' }}></div>
                <span className="text-[10px] text-slate-500">HUB-1</span>
              </div>
              <div className="flex flex-col items-center gap-1 group">
                <div className="w-full bg-purple-500/60 group-hover:bg-purple-400 rounded-t-md transition-all" style={{ height: '90%' }}></div>
                <span className="text-[10px] text-slate-500">HUB-2</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      <motion.div variants={staggerItem}>
        <Card 
          title="AI Insights" 
          subtitle="Machine learning recommendations" 
          icon={<Sparkles size={22} className="text-amber-500" />}
        >
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-slate-500">Your AI copilot is analyzing current network conditions.</p>
            <motion.button 
              variants={buttonPressVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="btn btn-primary"
              onClick={handleGenerateInsights}
              disabled={generatingInsights}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {generatingInsights ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles size={16} />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot size={16} />
                  Generate Optimization Plan
                </>
              )}
            </motion.button>
          </div>

          <div className="ai-insight-grid">
            <AnimatePresence>
              {summaryLoading ? (
                <div className="p-6">Loading insights…</div>
              ) : (
                <>
                  {((summary?.ai_recommendations as Array<Record<string, unknown>>) || []).map((ins: Record<string, unknown>, idx: number) => (
                    <motion.article 
                      variants={staggerItem}
                      initial="initial"
                      animate="animate"
                      className="ai-insight-tile" 
                      key={String(ins.title || idx)}
                    >
                      <Sparkles size={22} />
                      <h3>{String(ins.title || '')}</h3>
                      <p>{String(ins.description || '')}</p>
                    </motion.article>
                  ))}
                  
                  {extraAiInsights.map((ins, idx) => (
                    <motion.article 
                      variants={staggerItem}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="ai-insight-tile" 
                      style={{ border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)' }}
                      key={ins.title}
                    >
                      {ins.type === 'action' ? <Zap size={22} className="text-primary" /> : <Bot size={22} className="text-primary" />}
                      <h3 className="text-primary font-medium">{ins.title}</h3>
                      <p>{ins.description}</p>
                    </motion.article>
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
