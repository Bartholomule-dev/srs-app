// src/components/dashboard/LanguageSwitcher.tsx
'use client';

import { useActiveLanguage } from '@/lib/hooks';
import { LanguageBadge } from '@/components/ui';

const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, isLoading } = useActiveLanguage();

  if (isLoading) {
    return (
      <div
        className="h-8 w-32 animate-pulse bg-[var(--bg-surface-2)] rounded-md"
        aria-label="Loading language options"
        role="status"
      />
    );
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Language selection">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => setLanguage(lang.id)}
          disabled={isLoading}
          aria-pressed={lang.id === language}
          aria-label={`Switch to ${lang.label}`}
          className="transition-opacity hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] rounded-md"
        >
          <LanguageBadge
            language={lang.id}
            active={lang.id === language}
          />
        </button>
      ))}
    </div>
  );
}
