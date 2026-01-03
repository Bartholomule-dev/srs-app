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
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  // Display shows next card number (completed + 1), capped at total
  const displayCurrent = Math.min(current + 1, total);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${displayCurrent} of ${total} exercises`}
        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {displayCurrent} / {total}
      </span>
    </div>
  );
}
