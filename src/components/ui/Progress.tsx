'use client';

export interface ProgressProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Additional CSS classes */
  className?: string;
  /** Aria label for accessibility */
  'aria-label'?: string;
}

export function Progress({
  value,
  max = 100,
  className = '',
  'aria-label': ariaLabel,
}: ProgressProps) {
  // Calculate percentage for display and aria (0-100)
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
    >
      <div
        className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
