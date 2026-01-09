'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { DURATION, EASE } from '@/lib/motion';
import type { Achievement } from '@/lib/gamification/achievements';

export interface AchievementToastProps {
  /** The unlocked achievement to display */
  achievement: Achievement;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss duration in milliseconds (default: 5000) */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AchievementToast - Animated notification for achievement unlocks
 *
 * Features:
 * - Slides in from bottom-right
 * - Celebratory amber glow styling
 * - Animated icon with bounce effect
 * - Auto-dismisses after duration
 * - Keyboard accessible (Escape to dismiss)
 */
export function AchievementToast({
  achievement,
  onDismiss,
  duration = 5000,
  className,
}: AchievementToastProps) {
  const { name, description, icon } = achievement;

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: DURATION.normal, ease: EASE.default }}
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'min-w-[320px] max-w-[400px]',
        'rounded-xl border border-[var(--accent-primary)]/30',
        'bg-[var(--bg-surface-2)] backdrop-blur-sm',
        'shadow-lg shadow-[var(--accent-primary)]/10',
        'overflow-hidden',
        className
      )}
    >
      {/* Subtle animated glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.2] }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-4">
          {/* Icon with bounce animation */}
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-lg bg-[var(--accent-primary)]/10 text-3xl flex-shrink-0"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
              delay: 0.1,
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 0.4,
                delay: 0.4,
                ease: 'easeOut',
              }}
            >
              {icon}
            </motion.span>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Header */}
            <motion.p
              className="text-xs font-medium uppercase tracking-wider text-[var(--accent-primary)] mb-0.5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: DURATION.fast }}
            >
              Achievement Unlocked!
            </motion.p>

            {/* Achievement name */}
            <motion.h3
              className="font-semibold font-display text-[var(--text-primary)] truncate"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: DURATION.fast }}
            >
              {name}
            </motion.h3>

            {/* Description */}
            <motion.p
              className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: DURATION.fast }}
            >
              {description}
            </motion.p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg',
              'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-surface-3)]',
              'transition-colors duration-150'
            )}
            aria-label="Close achievement notification"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        className="h-1 bg-[var(--accent-primary)]"
        initial={{ scaleX: 1, originX: 0 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}
