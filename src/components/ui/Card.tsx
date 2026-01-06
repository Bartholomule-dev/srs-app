'use client';

import {
  Card as DarwinCard,
  CardHeader as DarwinCardHeader,
  CardContent as DarwinCardContent,
  CardFooter as DarwinCardFooter,
  CardTitle as DarwinCardTitle,
  CardDescription as DarwinCardDescription,
} from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardElevation = 'flat' | 1 | 2 | 3;

export interface CardProps extends ComponentProps<typeof DarwinCard> {
  children: ReactNode;
  elevation?: CardElevation;
  interactive?: boolean;
}

const elevationStyles: Record<CardElevation, string> = {
  flat: 'bg-transparent shadow-none border-transparent',
  1: 'bg-[var(--bg-surface-1)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
  2: 'bg-[var(--bg-surface-2)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
  3: 'bg-[var(--bg-surface-3)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
};

export function Card({
  children,
  elevation = 1,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <DarwinCard
      className={cn(
        elevationStyles[elevation],
        'transition-all duration-200',
        interactive && [
          'cursor-pointer',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
          'hover:border-[var(--accent-primary)]/40',
          'active:scale-[0.99]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </DarwinCard>
  );
}

export interface CardHeaderProps extends ComponentProps<typeof DarwinCardHeader> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <DarwinCardHeader className={className} {...props}>
      {children}
    </DarwinCardHeader>
  );
}

export interface CardContentProps extends ComponentProps<typeof DarwinCardContent> {
  children: ReactNode;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <DarwinCardContent className={className} {...props}>
      {children}
    </DarwinCardContent>
  );
}

export interface CardFooterProps extends ComponentProps<typeof DarwinCardFooter> {
  children: ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <DarwinCardFooter className={className} {...props}>
      {children}
    </DarwinCardFooter>
  );
}

export interface CardTitleProps extends ComponentProps<typeof DarwinCardTitle> {
  children: ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <DarwinCardTitle className={className} {...props}>
      {children}
    </DarwinCardTitle>
  );
}

export interface CardDescriptionProps extends ComponentProps<typeof DarwinCardDescription> {
  children: ReactNode;
}

export function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <DarwinCardDescription className={className} {...props}>
      {children}
    </DarwinCardDescription>
  );
}
