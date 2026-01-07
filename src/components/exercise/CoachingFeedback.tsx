'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CoachingFeedbackProps {
  /** The coaching feedback message */
  feedback: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Non-punitive coaching feedback component.
 * Displays when users get correct answers but don't use the target construct.
 * Blue info styling with subtle animation.
 */
export function CoachingFeedback({ feedback, className }: CoachingFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'rounded-lg border border-blue-500/30 bg-blue-500/10 p-4',
        className
      )}
      data-testid="coaching-feedback"
    >
      <div className="flex items-start gap-3">
        {/* Lightbulb icon */}
        <span className="text-lg flex-shrink-0" role="img" aria-label="lightbulb">
          💡
        </span>

        <div className="space-y-1">
          {/* Pro tip header */}
          <p className="text-sm font-semibold text-blue-300">
            Pro tip
          </p>

          {/* Feedback message */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {feedback}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
