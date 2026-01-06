'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, errorMessage, className, ...props }, ref) {
    const hasError = error || !!errorMessage;

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg px-4 py-2.5',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'border transition-all duration-150',
            'placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'border-[var(--accent-error)] focus:ring-[var(--accent-error)]/30'
              : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p className="mt-1.5 text-sm text-[var(--accent-error)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);
