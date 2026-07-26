import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Database } from "lucide-react";

interface TableProps {
  headers: ReactNode[];
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

export default function Table({
  headers,
  children,
  title,
  subtitle,
  action,
  loading = false,
  empty = false,
  emptyMessage = "No records found.",
}: TableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="data-table-shell"
    >
      {(title || subtitle || action) && (
        <div className="data-table-header">
          <div>
            {title && (
              <motion.h2
                className="data-table-title"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {title}
              </motion.h2>
            )}

            {subtitle && (
              <motion.p
                className="data-table-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {action && (
            <motion.div
              className="data-table-action"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {action}
            </motion.div>
          )}
        </div>
      )}

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={typeof header === 'string' ? header : index}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="opacity-70"
                >
                  {headers.map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-5"
                    >
                      <motion.div
                        className="h-4 rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]"
                        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" as const }}
                      />
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : empty ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="data-table-empty-cell"
                >
                  <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                    >
                      <Database size={28} className="text-slate-500" />
                    </motion.div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Nothing to Display
                      </h3>

                      <p className="mt-2 text-slate-400">
                        {emptyMessage}
                      </p>
                    </div>
                  </motion.div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
