'use client';

import { cn } from '@/lib/utils';

export interface LanguageBadgeProps {
  language: string;
  active?: boolean;
  className?: string;
}

const LANGUAGE_CONFIG: Record<string, { icon: string; label: string }> = {
  python: { icon: '🐍', label: 'Python' },
  javascript: { icon: '📜', label: 'JavaScript' },
};

export function LanguageBadge({ language, active, className }: LanguageBadgeProps) {
  const config = LANGUAGE_CONFIG[language] ?? { icon: '💻', label: language };

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
        active
          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
          : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
