'use client';

import { Alert as DarwinAlert } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export type AlertProps = ComponentProps<typeof DarwinAlert>;

export function Alert({ className = '', ...props }: AlertProps) {
  return <DarwinAlert className={className} {...props} />;
}
