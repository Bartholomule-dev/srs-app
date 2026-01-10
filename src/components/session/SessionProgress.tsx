'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

/** Card type for session progress visualization */
export type CardType = 'teaching' | 'practice' | 'review';

interface SessionProgressProps {
  /** Current card number (1-based for display, but internally 0-indexed completed count) */
  current: number;
  /** Total cards in session */
  total: number;
  /** Optional array of card types for each segment (teaching cards shown in blue) */
  cardTypes?: CardType[];
  /** Additional CSS classes */
  className?: string;
}

export function SessionProgress({
  current,
  total,
  cardTypes,
  className = '',
}: SessionProgressProps) {
  // Display shows next card number (completed + 1), capped at total
  const displayCurrent = Math.min(current + 1, total);

  // Calculate percentage for aria attributes
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Generate segments (memoized to avoid recreating array on every render)
  const segments = useMemo(
    () =>
      Array.from({ length: total }, (_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current && current < total;
        const cardType: CardType = cardTypes?.[index] ?? 'review';
        const isTeaching = cardType === 'teaching';

        return { index, isCompleted, isCurrent, cardType, isTeaching };
      }),
    [total, current, cardTypes]
  );

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
          segments.map(({ index, isCompleted, isCurrent, cardType, isTeaching }) => (
            <motion.div
              key={index}
              data-segment
              data-segment-type={cardType}
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
                data-segment-inner
                className={`
                  h-full rounded-full
                  ${isTeaching
                    ? isCurrent
                      ? 'bg-blue-500 shadow-[0_0_8px_rgb(59,130,246)]'
                      : 'bg-blue-500'
                    : isCurrent
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
