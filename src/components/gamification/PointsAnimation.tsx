'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatPoints } from '@/lib/gamification/points';

interface PointsAnimationProps {
  points: number;
  show?: boolean;
  variant?: 'success' | 'neutral';
  onComplete?: () => void;
  className?: string;
}

export function PointsAnimation({
  points,
  show = true,
  variant = 'success',
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'font-mono font-bold text-lg',
            variant === 'success' && 'text-accent-success',
            variant === 'neutral' && 'text-text-secondary',
            className
          )}
        >
          {formatPoints(points)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
