'use client';

import {
  Tooltip as DarwinTooltip,
  TooltipTrigger as DarwinTooltipTrigger,
  TooltipContent as DarwinTooltipContent,
  TooltipProvider as DarwinTooltipProvider,
} from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export interface TooltipProviderProps extends ComponentProps<typeof DarwinTooltipProvider> {
  children: ReactNode;
}

export function TooltipProvider({ children, ...props }: TooltipProviderProps) {
  return <DarwinTooltipProvider {...props}>{children}</DarwinTooltipProvider>;
}

export interface TooltipProps extends ComponentProps<typeof DarwinTooltip> {
  children: ReactNode;
}

export function Tooltip({ children, ...props }: TooltipProps) {
  return <DarwinTooltip {...props}>{children}</DarwinTooltip>;
}

export interface TooltipTriggerProps extends ComponentProps<typeof DarwinTooltipTrigger> {
  children: ReactNode;
}

export function TooltipTrigger({ children, className = '', ...props }: TooltipTriggerProps) {
  return (
    <DarwinTooltipTrigger className={className} {...props}>
      {children}
    </DarwinTooltipTrigger>
  );
}

export interface TooltipContentProps extends ComponentProps<typeof DarwinTooltipContent> {
  children: ReactNode;
}

export function TooltipContent({ children, className = '', ...props }: TooltipContentProps) {
  return (
    <DarwinTooltipContent className={className} {...props}>
      {children}
    </DarwinTooltipContent>
  );
}
