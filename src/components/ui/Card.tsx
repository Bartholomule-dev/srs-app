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

export interface CardProps extends ComponentProps<typeof DarwinCard> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <DarwinCard className={className} {...props}>
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
