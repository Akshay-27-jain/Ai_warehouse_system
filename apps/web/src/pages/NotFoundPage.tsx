import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Warehouse, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#040b17] to-slate-950 px-6 py-12">
      {/* Animated background orbs */}
      <motion.div
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/90 p-12 text-center shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
      >
        <motion.div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        >
          <Warehouse size={28} className="text-cyan-400" />
        </motion.div>

        <motion.p
          className="text-sm uppercase tracking-[0.32em] text-cyan-300/80"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Page not found
        </motion.p>

        <motion.h1
          className="mt-4 text-7xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.5, type: "spring", stiffness: 150 }}
        >
          404
        </motion.h1>

        <motion.p
          className="mt-4 text-base leading-7 text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          We couldn't find the page you were looking for. Use the dashboard to continue managing warehouse operations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30"
          >
            <ArrowLeft size={16} />
            Go to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
