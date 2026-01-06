'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--accent-primary)] text-white',
  secondary: 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)]',
  success: 'bg-green-600/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  destructive: 'bg-red-600/20 text-red-400 border-red-500/30',
  info: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  outline: 'bg-transparent border-[var(--border)] text-[var(--text-secondary)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ variant = 'default', children, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5',
          'rounded-full text-xs font-medium',
          'border border-transparent',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
