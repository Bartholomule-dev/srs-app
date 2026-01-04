'use client';

import { Button as DarwinButton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ComponentProps<typeof DarwinButton>, 'variant'> {
  variant?: ButtonVariant;
  /** Add accent glow effect (only applies to primary variant) */
  glow?: boolean;
}

// Map our variant names to darwin-ui variant names
const variantMap: Record<ButtonVariant, ComponentProps<typeof DarwinButton>['variant']> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
};

export function Button({
  variant = 'primary',
  glow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <DarwinButton
      variant={variantMap[variant]}
      className={cn(
        // Base animation with smooth transitions
        'transition-all duration-150 ease-out',
        // Hover: slight scale up and brightness increase
        'hover:scale-[1.02] hover:brightness-110',
        // Active: slight scale down for tactile feedback
        'active:scale-[0.98]',
        // Glow effect for primary buttons when enabled
        glow && variant === 'primary' && 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        className
      )}
      {...props}
    >
      {children}
    </DarwinButton>
  );
}
