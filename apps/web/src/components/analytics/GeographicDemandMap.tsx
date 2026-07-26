import { useState } from 'react';
import { MapPin, Navigation, TrendingUp, Truck, Warehouse, CheckCircle2 } from 'lucide-react';

interface RegionDemand {
  id: string;
  name: string;
  code: string;
  ordersCount: number;
  revenue: number;
  growth: string;
  topCategory: string;
  fulfillmentHub: string;
  status: 'optimal' | 'high-demand' | 'surge';
  coordinates: { x: number; y: number }; // percentage on SVG map
}

const REGIONS: RegionDemand[] = [
  { id: '1', name: 'Mumbai Metro & West', code: 'MUM', ordersCount: 1420, revenue: 48500, growth: '+28%', topCategory: 'Beverages & Snacks', fulfillmentHub: 'Central Hub (WH-001)', status: 'surge', coordinates: { x: 26, y: 55 } },
  { id: '2', name: 'Delhi NCR & North', code: 'DEL', ordersCount: 1280, revenue: 42100, growth: '+22%', topCategory: 'Packaged Foods', fulfillmentHub: 'North Regional (WH-002)', status: 'high-demand', coordinates: { x: 38, y: 28 } },
  { id: '3', name: 'Bangalore Tech Zone', code: 'BLR', ordersCount: 1650, revenue: 54200, growth: '+35%', topCategory: 'Personal Care & Cosmetics', fulfillmentHub: 'South Logistics Depot', status: 'surge', coordinates: { x: 42, y: 72 } },
  { id: '4', name: 'Kolkata & East Belt', code: 'CCU', ordersCount: 890, revenue: 26800, growth: '+15%', topCategory: 'Household Essentials', fulfillmentHub: 'East Depot (WH-003)', status: 'optimal', coordinates: { x: 74, y: 46 } },
  { id: '5', name: 'Chennai Port Hub', code: 'MAA', ordersCount: 940, revenue: 31500, growth: '+18%', topCategory: 'Beverages', fulfillmentHub: 'South Logistics Depot', status: 'optimal', coordinates: { x: 48, y: 80 } },
  { id: '6', name: 'Hyderabad Central', code: 'HYD', ordersCount: 1100, revenue: 36400, growth: '+24%', topCategory: 'Electronics & Home', fulfillmentHub: 'Central Hub (WH-001)', status: 'high-demand', coordinates: { x: 44, y: 60 } },
];

export default function GeographicDemandMap() {
  const [selectedRegion, setSelectedRegion] = useState<RegionDemand>(REGIONS[0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'surge':
        return <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">🔥 Surge Demand</span>;
      case 'high-demand':
        return <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">📈 High Volume</span>;
      default:
        return <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">🟢 Optimal SLA</span>;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Navigation size={16} /> Regional Distribution & Geographic Demand
          </div>
          <h2 className="text-2xl font-bold text-slate-100">National Fulfillment Heatmap</h2>
          <p className="text-sm text-slate-400">Click any fulfillment zone to inspect regional order velocity, revenue, and nearest warehouse SLA.</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Surge Peak Zone</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> High Volume</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Optimal Coverage</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Map Canvas */}
        <div className="lg:col-span-2 relative min-h-[380px] rounded-2xl border border-slate-800 bg-slate-950/80 p-6 overflow-hidden flex items-center justify-center">
          {/* Background grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Stylized Region Markers */}
          <div className="relative w-full h-[320px] max-w-lg">
            {REGIONS.map((region) => {
              const isSelected = selectedRegion.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  style={{ left: `${region.coordinates.x}%`, top: `${region.coordinates.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 cursor-pointer ${
                    isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
                  }`}
                >
                  {/* Pulse Ring */}
                  <span
                    className={`absolute -inset-2 rounded-full animate-ping opacity-75 ${
                      region.status === 'surge' ? 'bg-rose-500' : region.status === 'high-demand' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  {/* Pin Dot */}
                  <div
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border shadow-lg transition ${
                      region.status === 'surge'
                        ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                        : region.status === 'high-demand'
                        ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
                        : 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
                    } ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : ''}`}
                  >
                    <MapPin size={14} />
                    <span>{region.code}</span>
                    <span className="text-[10px] opacity-80">({region.ordersCount})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Inspector Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{selectedRegion.name}</h3>
              <span className="text-xs font-mono text-cyan-400">Region Code: {selectedRegion.code}</span>
            </div>
            {getStatusBadge(selectedRegion.status)}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400 flex items-center gap-1">
                <Truck size={12} className="text-cyan-400" /> Total Orders
              </span>
              <div className="mt-1 text-xl font-bold text-slate-100">{selectedRegion.ordersCount.toLocaleString()}</div>
              <span className="text-[11px] font-bold text-emerald-400">{selectedRegion.growth} vs last month</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-400" /> Revenue
              </span>
              <div className="mt-1 text-xl font-bold text-cyan-400">${selectedRegion.revenue.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400">Order Avg: $34.20</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
              <div className="text-slate-400 font-semibold">Assigned Fulfillment Warehouse:</div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                <Warehouse size={16} className="text-cyan-400" /> {selectedRegion.fulfillmentHub}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Same-day delivery SLA active (98.4% on-time)
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1">
              <div className="text-slate-400 font-semibold">Top Regional FMCG Category:</div>
              <div className="font-bold text-cyan-300">{selectedRegion.topCategory}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
