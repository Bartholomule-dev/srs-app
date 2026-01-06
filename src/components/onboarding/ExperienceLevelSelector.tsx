'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ExperienceLevel } from '@/lib/types/app.types';

interface ExperienceLevelSelectorProps {
  onSelect: (level: ExperienceLevel) => void;
  loading?: boolean;
}

const LEVELS = [
  {
    value: 'refresher' as const,
    label: 'Shaking off rust',
    description: 'I know Python but need to rebuild muscle memory',
    icon: '🔄',
  },
  {
    value: 'learning' as const,
    label: 'Building skills',
    description: "I'm still learning Python fundamentals",
    icon: '📚',
  },
  {
    value: 'beginner' as const,
    label: 'New to Python',
    description: "I'm just getting started with Python",
    icon: '🌱',
  },
];

export function ExperienceLevelSelector({
  onSelect,
  loading = false,
}: ExperienceLevelSelectorProps) {
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          How would you describe your Python experience?
        </h2>
        <p className="mt-2 text-text-secondary">
          This helps us personalize your practice sessions
        </p>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setSelected(level.value)}
            className={cn(
              'w-full p-4 rounded-lg border text-left transition-all',
              'hover:border-accent-primary/50',
              selected === level.value
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-border bg-bg-surface-1'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <div className="font-medium text-text-primary">{level.label}</div>
                <div className="text-sm text-text-secondary">{level.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected || loading}
        loading={loading}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
