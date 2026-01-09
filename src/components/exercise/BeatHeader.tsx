'use client';

import { cn } from '@/lib/utils';

interface BeatHeaderProps {
  skinIcon: string | null;
  blueprintTitle: string | null;
  beat: number | null;
  totalBeats: number | null;
  beatTitle: string | null;
  className?: string;
  showQuickDrill?: boolean;
}

/**
 * Header showing blueprint/skin context during exercise practice.
 * Displays the current skin icon, blueprint title, beat progress, and beat title.
 */
export function BeatHeader({
  skinIcon,
  blueprintTitle,
  beat,
  totalBeats,
  beatTitle,
  className,
  showQuickDrill = false,
}: BeatHeaderProps) {
  // For standalone exercises when showQuickDrill is enabled
  if (!beat && showQuickDrill) {
    return (
      <div
        data-testid="beat-header"
        className={cn(
          'flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4',
          'px-3 py-2 rounded-lg bg-[var(--bg-surface-1)]',
          className
        )}
      >
        <span className="text-base">⚡</span>
        <span className="font-medium text-[var(--text-primary)]">Quick Drill</span>
      </div>
    );
  }

  // Don't render if no beat context and no Quick Drill
  if (!beat || !blueprintTitle) {
    return null;
  }

  return (
    <div
      data-testid="beat-header"
      className={cn(
        'flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4',
        'px-3 py-2 rounded-lg bg-[var(--bg-surface-1)]',
        className
      )}
    >
      {skinIcon && <span className="text-base">{skinIcon}</span>}
      <span className="font-medium text-[var(--text-primary)]">{blueprintTitle}</span>
      <span className="text-[var(--text-tertiary)]">·</span>
      <span>
        Beat {beat} of {totalBeats}
      </span>
      {beatTitle && (
        <>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="italic">&quot;{beatTitle}&quot;</span>
        </>
      )}
    </div>
  );
}
