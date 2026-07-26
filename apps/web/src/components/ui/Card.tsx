import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cardHoverVariants, smoothTransition } from "../../animations/variants";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export default function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  loading = false,
}: CardProps) {
  return (
    <motion.section
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={cardHoverVariants}
      transition={smoothTransition}
      className={`app-card ${className}`}
    >
      {(title || subtitle || icon || action) && (
        <div className="app-card-header">
          <div className="app-card-title-group">
            {icon && (
              <div className="app-card-icon">
                {icon}
              </div>
            )}

            <div>
              {title && (
                <h3 className="app-card-title">
                  {title}
                </h3>
              )}

              {subtitle && (
                <p className="app-card-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="app-card-action">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="app-card-body">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-slate-700" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-4 w-5/6 rounded bg-slate-800" />
            <div className="h-4 w-3/4 rounded bg-slate-800" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.section>
  );
}
