'use client';

import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from './Card';
import { Button } from './Button';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
}

/**
 * Error boundary for feature components with graceful fallback UI.
 *
 * Usage:
 * ```tsx
 * <FeatureErrorBoundary featureName="Skill Tree">
 *   <SkillTree />
 * </FeatureErrorBoundary>
 * ```
 *
 * Features:
 * - Catches errors in child components
 * - Shows styled fallback with feature name
 * - Provides retry button to reset error state
 * - Uses theme-consistent styling
 */
export function FeatureErrorBoundary({
  children,
  featureName,
}: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <Card
          elevation={1}
          className="p-8 text-center"
          data-testid="feature-error-fallback"
        >
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            {/* Error icon */}
            <div className="w-12 h-12 rounded-full bg-[var(--accent-error)]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--accent-error)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error message */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Unable to load {featureName}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                An error occurred while loading this feature.
              </p>
            </div>

            {/* Error details (collapsed by default in production) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="w-full text-left">
                <summary className="text-sm text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                  Error details
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-[var(--bg-surface-2)] text-xs text-[var(--text-secondary)] overflow-x-auto">
                  {error.message}
                </pre>
              </details>
            )}

            {/* Retry button */}
            <Button
              onClick={reset}
              variant="secondary"
              size="md"
              data-testid="feature-error-retry"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </Button>
          </div>
        </Card>
      )}
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error in ${featureName}:`, error, errorInfo);
        }
        // In production, you could send to error tracking service here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
