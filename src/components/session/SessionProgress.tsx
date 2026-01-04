'use client';

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
            <div
              key={index}
              className={`
                h-2 flex-1 rounded-full transition-all duration-200 ease-out
                ${isCompleted
                  ? 'bg-[var(--accent-primary)]'
                  : isCurrent
                    ? 'bg-[var(--accent-primary)] scale-y-125 shadow-[0_0_8px_var(--accent-primary)]'
                    : 'bg-[var(--bg-surface-3)]'
                }
              `}
            />
          ))
        )}
      </div>
      <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
        {displayCurrent} / {total}
      </span>
    </div>
  );
}
