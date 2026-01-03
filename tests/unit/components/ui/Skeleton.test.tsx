// tests/unit/components/ui/Skeleton.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders skeleton element', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('applies custom styles', () => {
    render(<Skeleton style={{ width: '100px', height: '20px' }} data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '100px', height: '20px' });
  });

  it('renders multiple skeletons for list loading', () => {
    render(
      <div>
        <Skeleton data-testid="skeleton-1" />
        <Skeleton data-testid="skeleton-2" />
        <Skeleton data-testid="skeleton-3" />
      </div>
    );

    expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-3')).toBeInTheDocument();
  });
});
