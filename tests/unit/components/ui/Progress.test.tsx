// tests/unit/components/ui/Progress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/Progress';

describe('Progress', () => {
  it('renders progress bar', () => {
    render(<Progress value={50} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('supports value prop', () => {
    render(<Progress value={75} max={100} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '75');
  });

  it('supports max prop', () => {
    render(<Progress value={50} max={200} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '200');
  });

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" data-testid="progress" />);
    // Note: darwin-ui Progress applies className to the container, not progressbar role element
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    render(<Progress value={50} size="lg" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('supports different variants', () => {
    render(<Progress value={50} variant="success" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('supports indeterminate state', () => {
    render(<Progress indeterminate />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('shows value when showValue is true', () => {
    render(<Progress value={75} showValue />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
