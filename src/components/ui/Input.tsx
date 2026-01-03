'use client';

import { Input as DarwinInput } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface InputProps extends ComponentProps<typeof DarwinInput> {
  errorMessage?: string;
}

export function Input({ errorMessage, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      <DarwinInput
        className={className}
        error={error || !!errorMessage}
        {...props}
      />
      {errorMessage && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
