// tests/component/session/SessionProgress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionProgress } from '@/components/session';

describe('SessionProgress', () => {
  // Note: The component displays (current + 1) / total to show which card you're on
  // When current=3, display shows "4 / 10" meaning "you're on card 4 of 10"
  it('displays current card number and total count', () => {
    render(<SessionProgress current={3} total={10} />);
    // current=3 completed means you're on card 4
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
  });

  it('displays correct progress bar percentage', () => {
    render(<SessionProgress current={5} total={10} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles edge case of 0/0', () => {
    render(<SessionProgress current={0} total={0} />);
    // With 0 total, displayCurrent = min(0+1, 0) = 0
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles edge case of 1/1 (100%)', () => {
    render(<SessionProgress current={1} total={1} />);
    // current=1 with total=1 means completed, displayCurrent = min(1+1, 1) = 1
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles completed state where current equals total', () => {
    render(<SessionProgress current={10} total={10} />);
    // displayCurrent = min(10+1, 10) = 10
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('displays first card as 1 when starting fresh', () => {
    render(<SessionProgress current={0} total={10} />);
    // current=0 completed means you're on card 1
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SessionProgress current={1} total={5} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
