'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
  success: 'bg-green-900/20 border-green-500/30 text-green-100',
  warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
  error: 'bg-red-900/20 border-red-500/30 text-red-100',
};

const variantIcons: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  function Alert(
    { variant = 'info', title, description, dismissible, onDismiss, children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg border p-4',
          'flex items-start gap-3',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          {variantIcons[variant]}
        </span>
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium">{title}</p>}
          {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
          {children}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>
    );
  }
);
