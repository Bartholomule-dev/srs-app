'use client';

import { Skeleton as DarwinSkeleton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export type SkeletonProps = ComponentProps<typeof DarwinSkeleton>;

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return <DarwinSkeleton className={className} {...props} />;
}
