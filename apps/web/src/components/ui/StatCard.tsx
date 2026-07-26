import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

import { cardHoverVariants, smoothTransition } from "../../animations/variants";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  tone?: "cyan" | "amber" | "emerald" | "violet" | "rose" | "slate" | "indigo" | "blue";
  icon?: ReactNode;
  loading?: boolean;
}

const toneStyles = {
  cyan: {
    bg: "from-cyan-500/15 to-cyan-700/5",
    icon: "bg-cyan-500/15 text-cyan-400",
    border: "border-cyan-500/20",
  },
  amber: {
    bg: "from-amber-500/15 to-amber-700/5",
    icon: "bg-amber-500/15 text-amber-400",
    border: "border-amber-500/20",
  },
  emerald: {
    bg: "from-emerald-500/15 to-emerald-700/5",
    icon: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/20",
  },
  violet: {
    bg: "from-violet-500/15 to-violet-700/5",
    icon: "bg-violet-500/15 text-violet-400",
    border: "border-violet-500/20",
  },
  indigo: {
    bg: "from-indigo-500/15 to-indigo-700/5",
    icon: "bg-indigo-500/15 text-indigo-400",
    border: "border-indigo-500/20",
  },
  blue: {
    bg: "from-blue-500/15 to-blue-700/5",
    icon: "bg-blue-500/15 text-blue-400",
    border: "border-blue-500/20",
  },
  rose: {
    bg: "from-rose-500/15 to-rose-700/5",
    icon: "bg-rose-500/15 text-rose-400",
    border: "border-rose-500/20",
  },
  slate: {
    bg: "from-slate-500/15 to-slate-700/5",
    icon: "bg-slate-500/15 text-slate-300",
    border: "border-slate-500/20",
  },
};

export default function StatCard({
  label,
  value,
  hint,
  trend,
  tone = "cyan",
  icon,
  loading = false,
}: StatCardProps) {
  const style = toneStyles[tone] || toneStyles.cyan;

  const isPositive =
    trend?.trim().startsWith("+") ?? false;

  const isNegative =
    trend?.trim().startsWith("-") ?? false;

  return (
    <motion.article
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={cardHoverVariants}
      transition={smoothTransition}
      className={`
        relative
        overflow-hidden
        rounded-3xl
        border
        ${style.border}
        bg-gradient-to-br
        ${style.bg}
        backdrop-blur-xl
        p-6
        shadow-xl
      `}
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 rounded bg-slate-700" />
          <div className="h-10 w-28 rounded bg-slate-600" />
          <div className="h-4 w-40 rounded bg-slate-700" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-slate-400">
                {label}
              </p>

              <h2 className="mt-3 text-4xl font-bold text-white">
                {value}
              </h2>
            </div>

            {icon && (
              <div
                className={`
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  ${style.icon}
                `}
              >
                {icon}
              </div>
            )}
          </div>

          {hint && (
            <p className="mt-4 text-sm text-slate-400">
              {hint}
            </p>
          )}

          {trend && (
            <div
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : isNegative
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {isPositive && (
                <ArrowUpRight size={16} />
              )}

              {isNegative && (
                <ArrowDownRight size={16} />
              )}

              {!isPositive &&
                !isNegative && (
                  <Minus size={16} />
                )}

              {trend}
            </div>
          )}
        </>
      )}
    </motion.article>
  );
}