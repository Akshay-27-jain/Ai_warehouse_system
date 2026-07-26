import { useState } from 'react';
import { Box, Layers, MapPin, Navigation, Zap, Info } from 'lucide-react';

interface RackSlot {
  id: string;
  aisle: string;
  rack: string;
  zone: string;
  occupancy: number; // percentage 0-100
  velocity: 'low' | 'medium' | 'high' | 'surge';
  itemsCount: number;
  topProduct: string;
  sku: string;
}

const SAMPLE_SLOTS: RackSlot[] = [
  { id: 'A1', aisle: 'Aisle A', rack: 'A1', zone: 'Fast Pick Zone', occupancy: 92, velocity: 'surge', itemsCount: 450, topProduct: 'Sparkling Mineral Water 500ml', sku: 'BEV-SPK-001' },
  { id: 'A2', aisle: 'Aisle A', rack: 'A2', zone: 'Fast Pick Zone', occupancy: 78, velocity: 'high', itemsCount: 320, topProduct: 'Premium Organic Green Tea 100s', sku: 'BEV-TEA-002' },
  { id: 'A3', aisle: 'Aisle A', rack: 'A3', zone: 'Fast Pick Zone', occupancy: 65, velocity: 'medium', itemsCount: 280, topProduct: 'Roasted Almonds 200g', sku: 'SNK-ALM-003' },
  { id: 'A4', aisle: 'Aisle A', rack: 'A4', zone: 'Fast Pick Zone', occupancy: 88, velocity: 'surge', itemsCount: 510, topProduct: 'Dark Chocolate Bar 70%', sku: 'SNK-CHO-004' },
  
  { id: 'B1', aisle: 'Aisle B', rack: 'B1', zone: 'Packaged Foods', occupancy: 40, velocity: 'low', itemsCount: 150, topProduct: 'Multigrain Oats 1kg', sku: 'FOD-OAT-005' },
  { id: 'B2', aisle: 'Aisle B', rack: 'B2', zone: 'Packaged Foods', occupancy: 85, velocity: 'high', itemsCount: 410, topProduct: 'Extra Virgin Olive Oil 1L', sku: 'FOD-OIL-006' },
  { id: 'B3', aisle: 'Aisle B', rack: 'B3', zone: 'Packaged Foods', occupancy: 70, velocity: 'medium', itemsCount: 300, topProduct: 'Basmati Rice 5kg', sku: 'FOD-RIC-007' },
  { id: 'B4', aisle: 'Aisle B', rack: 'B4', zone: 'Packaged Foods', occupancy: 95, velocity: 'surge', itemsCount: 590, topProduct: 'Instant Noodles 12-Pack', sku: 'FOD-NDL-008' },
  
  { id: 'C1', aisle: 'Aisle C', rack: 'C1', zone: 'Personal Care', occupancy: 55, velocity: 'medium', itemsCount: 220, topProduct: 'Gentle Facial Cleanser 250ml', sku: 'CAR-FAC-009' },
  { id: 'C2', aisle: 'Aisle C', rack: 'C2', zone: 'Personal Care', occupancy: 82, velocity: 'high', itemsCount: 380, topProduct: 'Herbal Shampoo 400ml', sku: 'CAR-SHM-010' },
  { id: 'C3', aisle: 'Aisle C', rack: 'C3', zone: 'Personal Care', occupancy: 30, velocity: 'low', itemsCount: 110, topProduct: 'Moisturizing Lotion 300ml', sku: 'CAR-LOT-011' },
  { id: 'C4', aisle: 'Aisle C', rack: 'C4', zone: 'Personal Care', occupancy: 60, velocity: 'medium', itemsCount: 260, topProduct: 'Antibacterial Hand Wash 500ml', sku: 'CAR-HND-012' },
  
  { id: 'D1', aisle: 'Aisle D', rack: 'D1', zone: 'Household Cleaners', occupancy: 90, velocity: 'surge', itemsCount: 480, topProduct: 'Disinfectant Surface Spray', sku: 'HSH-DSP-013' },
  { id: 'D2', aisle: 'Aisle D', rack: 'D2', zone: 'Household Cleaners', occupancy: 72, velocity: 'medium', itemsCount: 310, topProduct: 'Dishwashing Liquid 1L', sku: 'HSH-DSH-014' },
  { id: 'D3', aisle: 'Aisle D', rack: 'D3', zone: 'Household Cleaners', occupancy: 45, velocity: 'low', itemsCount: 190, topProduct: 'Laundry Detergent Pods 30s', sku: 'HSH-LND-015' },
  { id: 'D4', aisle: 'Aisle D', rack: 'D4', zone: 'Household Cleaners', occupancy: 88, velocity: 'high', itemsCount: 440, topProduct: 'Microfiber Cleaning Cloths', sku: 'HSH-CLT-016' },
];

export default function WarehouseFloorPlan() {
  const [selectedSlot, setSelectedSlot] = useState<RackSlot>(SAMPLE_SLOTS[0]);
  const [filterVelocity, setFilterVelocity] = useState<string>('all');

  const filteredSlots = SAMPLE_SLOTS.filter((slot) => {
    if (filterVelocity === 'all') return true;
    return slot.velocity === filterVelocity;
  });

  const getSlotColorClass = (slot: RackSlot) => {
    if (slot.velocity === 'surge') return 'border-rose-500/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30';
    if (slot.occupancy > 80) return 'border-amber-500/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30';
    if (slot.velocity === 'high') return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30';
    return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30';
  };

  const getVelocityBadge = (velocity: string) => {
    switch (velocity) {
      case 'surge':
        return <span className="rounded-full bg-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-300">⚡ Surge Pick</span>;
      case 'high':
        return <span className="rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-300">🔥 High Fast</span>;
      case 'medium':
        return <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300">🟢 Normal</span>;
      default:
        return <span className="rounded-full bg-slate-500/30 px-2 py-0.5 text-xs font-semibold text-slate-300">🐢 Slow Storage</span>;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Layers size={16} /> 2D Spatial Layout & Pick Velocity Heatmap
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Warehouse Slotting Plan</h2>
          <p className="text-sm text-slate-400">Click any rack slot to inspect inventory density, SKU allocation, and picker route efficiency.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Filter Heatmap:</label>
          <select
            value={filterVelocity}
            onChange={(e) => setFilterVelocity(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">All Rack Slots</option>
            <option value="surge">⚡ Surge High-Velocity</option>
            <option value="high">🔥 High Fast</option>
            <option value="medium">🟢 Normal</option>
            <option value="low">🐢 Slow Moving</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2D Grid Representation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <div className="flex items-center gap-2"><Navigation size={14} className="text-emerald-400" /> Receiving / Loading Bay (Front)</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Surge Peak</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> High Occupancy</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span> Fast Moving</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Optimal</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            {['Aisle A', 'Aisle B', 'Aisle C', 'Aisle D'].map((aisleName) => (
              <div key={aisleName} className="space-y-3">
                <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  {aisleName}
                </div>
                <div className="space-y-3">
                  {filteredSlots
                    .filter((s) => s.aisle === aisleName)
                    .map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${getSlotColorClass(
                          slot
                        )} ${selectedSlot.id === slot.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : ''}`}
                      >
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span>Rack {slot.rack}</span>
                          <span className="text-xs opacity-80">{slot.occupancy}%</span>
                        </div>
                        <div className="mt-1 text-[11px] truncate opacity-90">{slot.topProduct}</div>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span>{slot.itemsCount} units</span>
                          <span>{slot.velocity.toUpperCase()}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Slot Details Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Box size={18} className="text-cyan-400" />
              <h3 className="font-bold text-slate-100">Slot Inspector</h3>
            </div>
            {getVelocityBadge(selectedSlot.velocity)}
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <span className="text-xs text-slate-400">Slot Location:</span>
              <div className="font-semibold text-slate-100 text-base">{selectedSlot.aisle} • Rack {selectedSlot.rack}</div>
              <div className="text-xs text-cyan-400 flex items-center gap-1 mt-0.5">
                <MapPin size={12} /> Zone: {selectedSlot.zone}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rack Occupancy</span>
                <span className="font-bold text-slate-200">{selectedSlot.occupancy}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedSlot.occupancy > 85 ? 'bg-rose-500' : selectedSlot.occupancy > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${selectedSlot.occupancy}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Top SKU Allocated:</span>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80">
                <div className="font-bold text-slate-100">{selectedSlot.topProduct}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">SKU: {selectedSlot.sku}</div>
                <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>In-Slot Units:</span>
                  <span className="text-sm font-bold text-slate-100">{selectedSlot.itemsCount} pcs</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs text-cyan-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Zap size={14} /> AI Slotting Recommendation
              </div>
              <p className="text-[11px] leading-relaxed text-cyan-100/90">
                {selectedSlot.velocity === 'surge'
                  ? 'Keep this rack situated near Loading Dock A. Fast picking route reduces order staging time by 24%.'
                  : 'Slot density is balanced. Ideal for routine replenishment cycles.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
