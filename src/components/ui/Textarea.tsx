'use client';

import { Textarea as DarwinTextarea } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface TextareaProps extends ComponentProps<typeof DarwinTextarea> {
  monospace?: boolean;
}

export function Textarea({ monospace = false, className = '', ...props }: TextareaProps) {
  const fontClass = monospace ? 'font-mono' : '';
  return (
    <DarwinTextarea className={`${fontClass} ${className}`.trim()} {...props} />
  );
}
