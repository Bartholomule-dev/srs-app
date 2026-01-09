'use client';

import { cn } from '@/lib/utils';

interface BlueprintProgressProps {
  /** Title of the blueprint being worked on */
  blueprintTitle: string;
  /** Current beat number (1-based) */
  currentBeat: number;
  /** Total beats in the blueprint */
  totalBeats: number;
  /** Optional skin icon emoji */
  skinIcon?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Visual progress indicator showing current position in a blueprint's beats.
 * Displays as a progress bar with text showing "Beat X of Y".
 */
export function BlueprintProgress({
  blueprintTitle,
  currentBeat,
  totalBeats,
  skinIcon,
  className,
}: BlueprintProgressProps) {
  const progress = totalBeats > 0 ? Math.round((currentBeat / totalBeats) * 100) : 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {skinIcon && <span>{skinIcon}</span>}
          <span className="font-medium">{blueprintTitle}</span>
        </span>
        <span className="text-[var(--text-secondary)]">
          Beat {currentBeat} of {totalBeats}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Blueprint progress: ${currentBeat} of ${totalBeats} beats`}
        className="h-2 bg-[var(--bg-surface-2)] rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
