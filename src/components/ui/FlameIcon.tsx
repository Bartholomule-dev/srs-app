'use client';

import { Flame } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface FlameIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * FlameIcon - Animated flame icon for streak display
 * Uses Phosphor Icons with optional pulse animation
 */
export function FlameIcon({ size = 16, className = '', animate = true }: FlameIconProps) {
  if (!animate) {
    return (
      <Flame
        size={size}
        weight="fill"
        className={`text-[var(--accent-warning)] ${className}`}
      />
    );
  }

  return (
    <motion.span
      className={`inline-flex ${className}`}
      animate={{
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Flame
        size={size}
        weight="fill"
        className="text-[var(--accent-warning)]"
      />
    </motion.span>
  );
}
