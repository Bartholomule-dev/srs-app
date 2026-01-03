'use client';

import { Badge as DarwinBadge } from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export interface BadgeProps extends ComponentProps<typeof DarwinBadge> {
  children: ReactNode;
}

export function Badge({ children, className = '', ...props }: BadgeProps) {
  return (
    <DarwinBadge className={className} {...props}>
      {children}
    </DarwinBadge>
  );
}
