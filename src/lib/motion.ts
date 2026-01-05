/**
 * Motion System - Standardized animation constants
 *
 * Duration Tiers (per Codex recommendation):
 * - micro: ≤150ms (button hovers, toggles)
 * - fast: 200ms (small UI feedback)
 * - normal: 300ms (component transitions)
 * - slow: 400ms (larger component animations)
 * - page: 500ms (route transitions, hero reveals)
 */

export const DURATION = {
  micro: 0.15,
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  page: 0.5,
} as const;

/**
 * Easing Curves
 * - default: General-purpose ease-out
 * - emphasized: For attention-grabbing animations
 * - decelerate: For elements entering the screen
 */
export const EASE = {
  default: [0.25, 1, 0.5, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
} as const;

/**
 * Spring config for micro-interactions ONLY
 * (toggles, switches, small tactile feedback)
 * Do NOT use for layout/content transitions
 */
export const springConfig = {
  stiffness: 400,
  damping: 30,
} as const;

// Preset animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast, ease: EASE.default },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};

export const slideIn = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: DURATION.fast, ease: EASE.default },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};

// For staggered children animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};
