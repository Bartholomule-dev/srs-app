'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  glow?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--accent-primary)] text-white',
    'hover:bg-[var(--accent-primary)]/90',
    'focus-visible:ring-[var(--accent-primary)]/50'
  ),
  secondary: cn(
    'bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border)]',
    'hover:bg-[var(--bg-surface-3)] hover:border-[var(--border)]',
    'focus-visible:ring-[var(--border)]'
  ),
  ghost: cn(
    'bg-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]',
    'focus-visible:ring-[var(--border)]'
  ),
  danger: cn(
    'bg-[var(--accent-error)] text-white',
    'hover:bg-[var(--accent-error)]/90',
    'focus-visible:ring-[var(--accent-error)]/50'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      glow = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[var(--bg-base)]',
          'hover:scale-[1.02] hover:brightness-110',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          glow && variant === 'primary' && 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
