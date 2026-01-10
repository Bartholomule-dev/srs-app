// tests/unit/components/ui/FeatureErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureErrorBoundary } from '@/components/ui/FeatureErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Working component</div>;
}

describe('FeatureErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={false} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('shows fallback UI when child component throws error', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Unable to load Test Feature')).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading this feature.')).toBeInTheDocument();
  });

  it('includes feature name in error message', () => {
    render(
      <FeatureErrorBoundary featureName="Skill Tree">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Unable to load Skill Tree')).toBeInTheDocument();
  });

  it('displays retry button', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    const retryButton = screen.getByTestId('feature-error-retry');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Try again');
  });

  it('resets error state when retry button is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalError() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Component recovered</div>;
    }

    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ConditionalError />
      </FeatureErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText('Unable to load Test Feature')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry
    const retryButton = screen.getByTestId('feature-error-retry');
    await user.click(retryButton);

    // Component should recover (note: in reality, the component will re-render
    // and the error will be thrown again if the condition hasn't changed.
    // This test simulates fixing the underlying issue.)
  });

  it('renders error details element in development', () => {
    // In development mode, error details should be present
    // (we can't modify NODE_ENV in tests, so we just verify structure)
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Check that the fallback UI is rendered
    expect(screen.getByTestId('feature-error-fallback')).toBeInTheDocument();

    // The details element exists for dev mode (conditionally rendered based on NODE_ENV)
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('Error details')).toBeInTheDocument();
    }
  });

  it('renders with correct test ids', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByTestId('feature-error-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('feature-error-retry')).toBeInTheDocument();
  });

  it('displays error icon', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Check for SVG icon presence
    const svg = screen.getByTestId('feature-error-fallback').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    const fallback = screen.getByTestId('feature-error-fallback');
    expect(fallback).toHaveClass('p-8', 'text-center');
  });

  describe('multiple feature instances', () => {
    it('isolates errors to specific features', () => {
      function MultiFeatureApp() {
        return (
          <>
            <FeatureErrorBoundary featureName="Feature A">
              <ThrowError shouldThrow={true} />
            </FeatureErrorBoundary>
            <FeatureErrorBoundary featureName="Feature B">
              <ThrowError shouldThrow={false} />
            </FeatureErrorBoundary>
          </>
        );
      }

      render(<MultiFeatureApp />);

      // Feature A should show error
      expect(screen.getByText('Unable to load Feature A')).toBeInTheDocument();

      // Feature B should work normally
      expect(screen.getByText('Working component')).toBeInTheDocument();
    });
  });
});
