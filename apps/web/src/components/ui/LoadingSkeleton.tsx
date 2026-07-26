import { motion, type Variants } from "framer-motion";

interface LoadingSkeletonProps {
  rows?: number;
  type?: "card" | "table" | "list";
}

const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
};

const pulseVariants: Variants = {
  animate: (i: number) => ({
    opacity: [0.4, 1, 0.4],
    scale: [0.98, 1, 0.98],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      delay: i * 0.12,
      ease: "easeInOut" as const,
    },
  }),
};

function ShimmerBar({ className = "" }: { className?: string }) {
  return (
    <motion.div
      variants={shimmerVariants}
      animate="animate"
      className={`rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] ${className}`}
    />
  );
}

export default function LoadingSkeleton({
  rows = 4,
  type = "card",
}: LoadingSkeletonProps) {
  if (type === "table") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60"
      >
        <div className="overflow-hidden">
          <div className="h-14 border-b border-slate-800 bg-slate-800/40 px-6 flex items-center">
            <ShimmerBar className="h-4 w-40" />
          </div>

          {Array.from({ length: rows }).map((_, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={pulseVariants}
              animate="animate"
              className="flex items-center gap-6 border-b border-slate-800 px-6 py-5 last:border-none"
            >
              <ShimmerBar className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <ShimmerBar className="h-4 w-48" />
                <ShimmerBar className="h-3 w-32" />
              </div>
              <ShimmerBar className="h-8 w-20 rounded-full" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={pulseVariants}
            animate="animate"
            className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <ShimmerBar className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <ShimmerBar className="h-4 w-40" />
              <ShimmerBar className="h-3 w-60" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          custom={index}
          variants={pulseVariants}
          animate="animate"
          className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <ShimmerBar className="mb-5 h-12 w-12 rounded-2xl" />
          <ShimmerBar className="mb-4 h-5 w-32" />
          <ShimmerBar className="mb-3 h-10 w-24" />
          <ShimmerBar className="h-3 w-40" />
        </motion.div>
      ))}
    </div>
  );
}
