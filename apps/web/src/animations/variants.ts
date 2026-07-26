import type { Variants, Transition } from 'framer-motion';

/**
 * Modern Linear/Vercel-inspired Spring & Cubic Easing transitions
 */
export const smoothTransition: Transition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1],
  duration: 0.25,
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
};

export const softSpringTransition: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 14,
};

/**
 * Page route transition variants (fade + subtle 8px Y-slide)
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/**
 * Container variants for staggered child animations
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

/**
 * Stagger with scale for landing page cards
 */
export const staggerScaleItem: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 },
  },
};

/**
 * Card elevation & hover scale variants
 */
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.012,
    y: -3,
    transition: smoothTransition,
  },
  tap: {
    scale: 0.99,
    y: 0,
  },
};

/**
 * Card hover with glow effect
 */
export const cardGlowHoverVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 0 0 rgba(34,211,238,0)',
  },
  hover: {
    scale: 1.02,
    y: -6,
    boxShadow: '0 20px 40px rgba(34,211,238,0.15)',
    transition: smoothTransition,
  },
  tap: {
    scale: 0.98,
    y: 0,
  },
};

/**
 * Modal Backdrop and Content scale-in variants
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 14,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/**
 * Form validation error shake animation
 */
export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

/**
 * Interactive button press variants
 */
export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: smoothTransition },
  tap: { scale: 0.97 },
};

/**
 * AI thinking dots pulsation variants
 */
export const thinkingDotsVariants: Variants = {
  animate: {
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Live status badge glowing pulse animation
 */
export const badgePulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.85, 1, 0.85],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Pop-in scale animation for metric numbers & badges
 */
export const scaleUpVariants: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: springTransition },
};

/**
 * Table row entrance animation
 */
export const tableRowVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: smoothTransition },
};

/**
 * Floating animation for decorative elements
 */
export const floatVariants: Variants = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const floatSlowVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Fade in from left/right for landing page sections
 */
export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: smoothTransition },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: smoothTransition },
};

/**
 * Gradient shift animation for backgrounds
 */
export const gradientShiftVariants: Variants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Counter number entrance variants
 */
export const counterVariants: Variants = {
  initial: { opacity: 0, scale: 0.5, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springTransition },
};

/**
 * Slide-in from bottom for sections
 */
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

/**
 * Hero text reveal - letter by letter
 */
export const letterRevealVariants: Variants = {
  initial: { opacity: 0, y: 40, rotateX: -90 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.03,
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  }),
};
