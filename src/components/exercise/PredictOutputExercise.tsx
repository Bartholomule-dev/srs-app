'use client';

import { useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PredictOutputExerciseProps {
  code: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function PredictOutputExercise({
  code,
  value,
  onChange,
  onSubmit,
  disabled = false,
}: PredictOutputExerciseProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (value.trim() && !disabled) {
      onSubmit(value);
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div data-testid="predict-output-exercise" className="space-y-4">
      {/* Code display */}
      <div className="rounded-lg bg-bg-surface-2 border border-border-subtle overflow-hidden">
        <div className="px-4 py-2 bg-bg-surface-3 border-b border-border-subtle">
          <span className="text-xs text-text-tertiary font-mono">Python</span>
        </div>
        <pre className="p-4 font-mono text-sm text-text-primary overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>

      {/* Answer input */}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">
          What will print?
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Enter the exact console output"
          className={cn(
            'w-full px-4 py-3 rounded-lg font-mono text-sm',
            'bg-bg-surface-1 border border-border-subtle',
            'text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
        <p className="text-xs text-text-tertiary">
          Enter the exact console output (case-sensitive)
        </p>
      </div>
    </div>
  );
}
