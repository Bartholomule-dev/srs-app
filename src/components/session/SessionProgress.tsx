'use client';

import { motion } from 'framer-motion';

interface SessionProgressProps {
  /** Current card number (1-based for display, but internally 0-indexed completed count) */
  current: number;
  /** Total cards in session */
  total: number;
  /** Additional CSS classes */
  className?: string;
}

export function SessionProgress({
  current,
  total,
  className = '',
}: SessionProgressProps) {
  // Display shows next card number (completed + 1), capped at total
  const displayCurrent = Math.min(current + 1, total);

  // Calculate percentage for aria attributes
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Generate segments
  const segments = Array.from({ length: total }, (_, index) => {
    const isCompleted = index < current;
    const isCurrent = index === current && current < total;

    return { index, isCompleted, isCurrent };
  });

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${displayCurrent} of ${total} exercises`}
        className="flex flex-1 items-center gap-1"
      >
        {total === 0 ? (
          // Empty state - show a single muted segment
          <div className="h-2 w-full rounded-full bg-[var(--bg-surface-3)]" />
        ) : (
          segments.map(({ index, isCompleted, isCurrent }) => (
            <motion.div
              key={index}
              className={`
                h-2 flex-1 rounded-full overflow-hidden
                ${isCompleted || isCurrent
                  ? ''
                  : 'bg-[var(--bg-surface-3)]'
                }
              `}
              initial={false}
            >
              <motion.div
                className={`
                  h-full rounded-full
                  ${isCurrent
                    ? 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'
                    : 'bg-[var(--accent-primary)]'
                  }
                `}
                initial={{ width: '0%' }}
                animate={{
                  width: isCompleted || isCurrent ? '100%' : '0%',
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 1, 0.5, 1],
                }}
              />
            </motion.div>
          ))
        )}
      </div>
      <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
        {displayCurrent} / {total}
      </span>
    </div>
  );
}
