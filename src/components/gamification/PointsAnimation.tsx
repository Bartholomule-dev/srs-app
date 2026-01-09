'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatPoints } from '@/lib/gamification/points';

interface PointsAnimationProps {
  points: number;
  show?: boolean;
  variant?: 'success' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  showSparkle?: boolean;
  onComplete?: () => void;
  className?: string;
}

const sizeClasses = {
  small: 'text-sm',
  medium: 'text-lg',
  large: 'text-2xl',
} as const;

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      data-testid="sparkle-icon"
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z" />
    </svg>
  );
}

export function PointsAnimation({
  points,
  show = true,
  variant = 'success',
  size = 'medium',
  showSparkle = false,
  onComplete,
  className,
}: PointsAnimationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 1.2 }}
          animate={{ opacity: 1, y: -10, scale: 1.0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'font-mono font-bold inline-flex items-center gap-1',
            sizeClasses[size],
            variant === 'success' && 'text-accent-success',
            variant === 'neutral' && 'text-text-secondary',
            className
          )}
        >
          {showSparkle && (
            <motion.span
              initial={{ rotate: 0, scale: 0 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <SparkleIcon className="w-4 h-4" />
            </motion.span>
          )}
          {formatPoints(points)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
