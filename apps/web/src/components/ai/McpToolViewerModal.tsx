import { useEffect, useState } from 'react';
import { X, Cpu, Server, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '../../lib/api';

interface ToolItem {
  name: string;
  description: string;
  server: string;
}

interface McpToolViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function McpToolViewerModal({ isOpen, onClose }: McpToolViewerModalProps) {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const res = await aiApi.listMcpTools();
      setTools((res as any).data?.tools || []);
    } catch {
      // Fallback local tool list if server offline
      setTools([
        { name: 'get_inventory', description: 'Retrieve stock levels', server: 'inventory_mcp' },
        { name: 'low_stock_products', description: 'Detect low stock alerts', server: 'inventory_mcp' },
        { name: 'dead_stock_products', description: 'Detect non-moving stock', server: 'inventory_mcp' },
        { name: 'warehouse_capacity', description: 'Check capacity limits', server: 'inventory_mcp' },
        { name: 'demand_forecast', description: 'Predict 30-day demand', server: 'forecast_mcp' },
        { name: 'reorder_prediction', description: 'Predict reorder dates', server: 'forecast_mcp' },
        { name: 'inventory_query', description: 'Safe read-only SQL query', server: 'database_mcp' },
        { name: 'supplier_score', description: 'Evaluate vendor scores', server: 'supplier_mcp' },
        { name: 'weather_forecast', description: 'Check regional weather', server: 'weather_mcp' },
        { name: 'send_email', description: 'Dispatch notification email', server: 'notification_mcp' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const servers = Array.from(new Set(tools.map((t) => t.server)));
  const filteredTools = activeServer === 'all' ? tools : tools.filter((t) => t.server === activeServer);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
                <Cpu size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Model Context Protocol (MCP) Server Architecture
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Active (7 Servers)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Registered tool capability registry for autonomous AI agent dispatching
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveServer('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeServer === 'all' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                All Tools ({tools.length})
              </button>
              {servers.map((srv) => (
                <button
                  key={srv}
                  onClick={() => setActiveServer(srv)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeServer === srv ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  {srv}
                </button>
              ))}
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-center gap-3 text-xs text-emerald-200">
              <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
              <div>
                <strong>Strict Security Sandbox:</strong> All MCP tools execute through backend REST validation. Database MCP restricts queries to safe read-only SELECT statements.
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading MCP tools...</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredTools.map((tool, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-400" />
                        {tool.name}()
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/80 px-2 py-0.5 rounded-md">
                        {tool.server}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{tool.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
