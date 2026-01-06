'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  monospace?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ monospace = false, error, errorMessage, className, ...props }, ref) {
    const hasError = error || !!errorMessage;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-lg px-4 py-3',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'border transition-all duration-150',
            'placeholder:text-[var(--text-tertiary)]',
            'resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'border-[var(--accent-error)] focus:ring-[var(--accent-error)]/30'
              : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20',
            monospace && 'font-mono',
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
