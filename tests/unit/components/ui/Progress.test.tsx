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

  it('displays percentage as aria-valuenow', () => {
    render(<Progress value={75} max={100} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '75');
  });

  it('calculates percentage correctly with custom max', () => {
    render(<Progress value={50} max={200} />);
    const progress = screen.getByRole('progressbar');
    // 50/200 = 25%
    expect(progress).toHaveAttribute('aria-valuenow', '25');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveClass('custom-progress');
  });

  it('has correct aria attributes', () => {
    render(<Progress value={50} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuenow', '50');
  });

  it('supports aria-label', () => {
    render(<Progress value={50} aria-label="Loading progress" />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-label', 'Loading progress');
  });

  it('handles zero max gracefully', () => {
    render(<Progress value={0} max={0} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
  });
});
