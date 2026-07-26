import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { buttonPressVariants, smoothTransition } from '../../animations/variants';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function AuthButton({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}: AuthButtonProps) {
  const baseClasses =
    'flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-95',
    secondary:
      'border border-slate-700/80 bg-slate-900/80 text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800',
  };

  return (
    <motion.button
      whileHover="hover"
      whileTap="tap"
      variants={buttonPressVariants}
      transition={smoothTransition}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-950" /> : null}
      {children}
    </motion.button>
  );
}
