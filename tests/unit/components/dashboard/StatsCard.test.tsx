// tests/unit/components/dashboard/StatsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Streak" value={7} />);

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<StatsCard label="Accuracy" value={85} suffix="%" />);

    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatsCard label="Streak" value={7} icon="fire" />);

    // Icon should be present (we use emoji for simplicity)
    expect(screen.getByText(/🔥/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatsCard label="Test" value={1} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without icon when not provided', () => {
    render(<StatsCard label="Streak" value={7} />);
    expect(screen.queryByText(/🔥|🎯|🏆|✓/)).not.toBeInTheDocument();
  });

  it('handles decimal values', () => {
    render(<StatsCard label="Average" value={3.14} />);
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });
});
