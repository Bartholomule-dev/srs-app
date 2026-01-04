'use client';

import { Progress } from '@/components/ui/Progress';

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

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Progress
        value={current}
        max={total}
        className="flex-1"
        aria-label={`Progress: ${displayCurrent} of ${total} exercises`}
      />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {displayCurrent} / {total}
      </span>
    </div>
  );
}
