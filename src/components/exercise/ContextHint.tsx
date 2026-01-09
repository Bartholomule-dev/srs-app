'use client';

import { cn } from '@/lib/utils';

interface ContextHintProps {
  context: string | null;
  className?: string;
}

/**
 * Displays skin-provided context for an exercise
 */
export function ContextHint({ context, className }: ContextHintProps) {
  if (!context) {
    return null;
  }

  return (
    <div
      className={cn(
        'text-sm text-[var(--text-secondary)] italic mb-4',
        'px-3 py-2 rounded-lg bg-[var(--bg-surface-1)] border-l-2 border-[var(--accent-primary)]',
        className
      )}
    >
      {context}
    </div>
  );
}
