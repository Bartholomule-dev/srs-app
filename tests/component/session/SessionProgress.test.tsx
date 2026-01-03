// tests/component/session/SessionProgress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionProgress } from '@/components/session';

describe('SessionProgress', () => {
  it('displays current and total count', () => {
    render(<SessionProgress current={3} total={10} />);
    expect(screen.getByText('3 of 10')).toBeInTheDocument();
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
    expect(screen.getByText('0 of 0')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles edge case of 1/1 (100%)', () => {
    render(<SessionProgress current={1} total={1} />);
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles completed state where current equals total', () => {
    render(<SessionProgress current={10} total={10} />);
    expect(screen.getByText('10 of 10')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('applies custom className', () => {
    const { container } = render(
      <SessionProgress current={1} total={5} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
