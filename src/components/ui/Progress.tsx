'use client';

import { Progress as DarwinProgress } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export type ProgressProps = ComponentProps<typeof DarwinProgress>;

export function Progress({ className = '', ...props }: ProgressProps) {
  return <DarwinProgress className={className} {...props} />;
}
