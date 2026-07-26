import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
  className = "",
  delay = 0,
  style,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(from);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    const startTime = Date.now() + delay * 1000;
    const startValue = from;
    const endValue = to;
    const difference = endValue - startValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * eased;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
        setHasAnimated(true);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isInView, from, to, duration, delay, hasAnimated]);

  const formattedValue =
    decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: delay + 0.2, ease: "easeOut" }}
      className={className}
      style={style}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}
