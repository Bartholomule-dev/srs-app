'use client';

import { Button as DarwinButton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ComponentProps<typeof DarwinButton>, 'variant'> {
  variant?: ButtonVariant;
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
  children,
  ...props
}: ButtonProps) {
  return (
    <DarwinButton
      variant={variantMap[variant]}
      {...props}
    >
      {children}
    </DarwinButton>
  );
}
