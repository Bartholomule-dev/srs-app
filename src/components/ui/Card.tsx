'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardElevation = 'flat' | 1 | 2 | 3;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
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

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ children, elevation = 1, interactive = false, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
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
      </div>
    );
  }
);

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 pt-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 pb-6 pt-2', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ children, className, ...props }, ref) {
    return (
      <h3 ref={ref} className={cn('text-lg font-semibold text-[var(--text-primary)]', className)} {...props}>
        {children}
      </h3>
    );
  }
);

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ children, className, ...props }, ref) {
    return (
      <p ref={ref} className={cn('text-sm text-[var(--text-secondary)] mt-1', className)} {...props}>
        {children}
      </p>
    );
  }
);
