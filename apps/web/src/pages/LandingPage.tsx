import { useRef } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  Layers,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
  Youtube,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "framer-motion";

import AnimatedCounter from "../components/ui/AnimatedCounter";
import ParticleBackground from "../components/ui/ParticleBackground";

const modules = [
  {
    icon: Boxes,
    title: "Inventory control",
    text: "Track stock levels, low-stock risk, and warehouse availability from one dashboard.",
    gradient: "from-emerald-500/20 to-teal-600/10",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: ShoppingCart,
    title: "Order fulfillment",
    text: "Follow payment, delivery, packing, transit, and completed order states.",
    gradient: "from-blue-500/20 to-indigo-600/10",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    icon: Bot,
    title: "AI assistant",
    text: "Ask operational questions about products, orders, stock, and seasonal demand.",
    gradient: "from-violet-500/20 to-purple-600/10",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: Bell,
    title: "Email alerts",
    text: "Send alerts for low stock, payments, delivery updates, and forecast changes.",
    gradient: "from-amber-500/20 to-orange-600/10",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
];

const signals = [
  "Festival demand planning",
  "Payment and delivery tracking",
  "Warehouse-level visibility",
  "Product margin monitoring",
];

const stats = [
  {
    icon: PackageSearch,
    value: 128,
    suffix: "",
    label: "Catalog SKUs",
    gradient: "#06b6d4, #3b82f6",
  },
  {
    icon: TrendingUp,
    value: 32,
    suffix: "%",
    label: "Demand lift",
    gradient: "#10b981, #14b8a6",
  },
  {
    icon: ShieldCheck,
    value: 94,
    suffix: "%",
    label: "Paid orders",
    gradient: "#8b5cf6, #a855f7",
  },
];

export default function LandingPage() {
  const modulesRef = useRef<HTMLDivElement>(null);
  const modulesInView = useInView(modulesRef, { once: true, margin: "-100px" });

  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-[#040b17] to-slate-950 text-white">
      <ParticleBackground particleCount={40} />

      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: "radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)" }}></div>
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[600px] w-[600px] rounded-full opacity-15 blur-[150px]" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)" }}></div>
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full opacity-10 blur-[100px]" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(34,211,238,0.05) 50%, transparent 70%)" }}></div>

      {/* NAVIGATION */}
      <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25">
            <Warehouse size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            AI <span className="text-cyan-400">Warehouse</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-colors hover:border-cyan-500/50 hover:text-cyan-300">
            Login
          </Link>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30">
            Create Account
            <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Hero Copy */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300 backdrop-blur-sm">
              <Zap size={14} className="text-cyan-300" />
              AI Warehouse Optimization System
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Plan stock, orders, and{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                seasonal demand
              </span>{" "}
              before operations get crowded.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              A full warehouse operations workspace for inventory teams, order managers, and
              planners who need cleaner visibility across products, payments, delivery,
              analytics, and AI-assisted decisions.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40">
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/50 px-6 py-3.5 text-base font-semibold text-slate-200 backdrop-blur-sm transition-all hover:border-slate-500/80 hover:bg-slate-800/50">
                <Database size={18} />
                Sign In
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" />
                99.9% Uptime
              </span>
              <span className="flex items-center gap-1.5">
                <Youtube size={14} className="text-rose-400" />
                Video Demos
              </span>
            </div>
          </div>

          {/* Operations Preview Panel */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-60 blur-xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div>
                  <strong className="text-sm font-bold text-white">Operations Preview</strong>
                  <span className="ml-2 text-xs text-slate-500">Live control room</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Healthy
                </span>
              </div>

              <div ref={statsRef} className="grid grid-cols-3 gap-3 p-5">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                      <Icon size={20} className="mb-2 text-slate-400" />
                      <div className="text-2xl font-bold tracking-tight text-white">
                        <AnimatedCounter
                          to={stat.value}
                          suffix={stat.suffix}
                          duration={1.5}
                          delay={index * 0.2 + 0.5}
                          className="bg-gradient-to-r bg-clip-text text-transparent"
                          style={{ backgroundImage: `linear-gradient(to right, ${stat.gradient})` }}
                        />
                      </div>
                      <span className="mt-1 block text-xs text-slate-500">{stat.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/5 px-6 py-4">
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Sparkles size={12} />
                  Active Signals
                </div>
                <div className="grid gap-2.5">
                  {signals.map((signal) => (
                    <div key={signal} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      </div>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div ref={modulesRef} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-slate-400 backdrop-blur-sm">
            <Zap size={12} className="text-cyan-400" />
            Core Modules
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              run operations
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            A unified dashboard with AI-powered insights, real-time tracking, and seamless workflow automation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.title} className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${module.gradient} p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20`}>
                <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-white/5" />
                </div>
                <div className={`relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${module.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={24} />
                </div>
                <h3 className="relative z-10 text-lg font-bold text-white transition-colors duration-300 group-hover:text-cyan-200">
                  {module.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-relaxed text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
                  {module.text}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-sky-500"
                  style={{ transform: "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s ease" }}></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-violet-500/10 px-8 py-14 text-center backdrop-blur-2xl sm:px-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-[100px]"></div>
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[100px]"></div>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300 backdrop-blur-sm">
            <Sparkles size={12} />
            Ready to Get Started?
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Transform your{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              warehouse operations
            </span>{" "}
            today
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-slate-400">
            Join forward-looking teams who use AI Warehouse to reduce stockouts by 40% and improve order fulfillment speed.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40">
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/50 px-6 py-3.5 text-base font-semibold text-slate-200 backdrop-blur-sm transition-all hover:border-slate-500/80 hover:bg-slate-800/50">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Warehouse size={16} className="text-cyan-400" />
            <span>AI Warehouse Management System</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            <span className="hidden sm:inline">Enterprise Suite v1.0</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
