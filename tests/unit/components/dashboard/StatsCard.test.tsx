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
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders SVG icon when provided', () => {
    const { container } = render(<StatsCard label="Streak" value={7} icon="fire" />);

    // Should have an SVG icon (not emoji anymore)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatsCard label="Test" value={1} className="custom-class" />
    );

    // The Card with custom class
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    const { container } = render(<StatsCard label="Streak" value={7} />);

    // Should not have any SVG icons when no icon prop
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('renders positive trend indicator', () => {
    render(<StatsCard label="Total" value={100} trend={5} />);

    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('renders negative trend indicator', () => {
    render(<StatsCard label="Total" value={100} trend={-3} />);

    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('does not render trend indicator when trend is 0', () => {
    render(<StatsCard label="Total" value={100} trend={0} />);

    // Should not show +0 or -0 for trend
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
    expect(screen.queryByText('-0')).not.toBeInTheDocument();

    // The value 100 should be shown
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('uses different icons for different icon types', () => {
    const { rerender, container } = render(<StatsCard label="Test" value={1} icon="fire" />);
    const fireSvg = container.querySelector('svg');
    expect(fireSvg).toBeInTheDocument();

    rerender(<StatsCard label="Test" value={1} icon="target" />);
    const targetSvg = container.querySelector('svg');
    expect(targetSvg).toBeInTheDocument();

    rerender(<StatsCard label="Test" value={1} icon="trophy" />);
    const trophySvg = container.querySelector('svg');
    expect(trophySvg).toBeInTheDocument();

    rerender(<StatsCard label="Test" value={1} icon="check" />);
    const checkSvg = container.querySelector('svg');
    expect(checkSvg).toBeInTheDocument();

    rerender(<StatsCard label="Test" value={1} icon="chart" />);
    const chartSvg = container.querySelector('svg');
    expect(chartSvg).toBeInTheDocument();
  });

  describe('variant prop', () => {
    it('renders hero variant with larger styling', () => {
      const { container } = render(
        <StatsCard label="Streak" value={7} icon="fire" variant="hero" />
      );

      // Hero should have min-h-[140px]
      const card = container.querySelector('[class*="min-h-[140px]"]');
      expect(card).toBeInTheDocument();

      // Hero should have p-6 padding
      const content = container.querySelector('[class*="p-6"]');
      expect(content).toBeInTheDocument();
    });

    it('renders supporting variant with smaller styling', () => {
      const { container } = render(
        <StatsCard label="Today" value={15} icon="check" variant="supporting" />
      );

      // Supporting should have min-h-[100px]
      const card = container.querySelector('[class*="min-h-[100px]"]');
      expect(card).toBeInTheDocument();

      // Supporting should have p-4 padding
      const content = container.querySelector('[class*="p-4"]');
      expect(content).toBeInTheDocument();
    });

    it('defaults to supporting variant', () => {
      const { container } = render(
        <StatsCard label="Total" value={100} icon="chart" />
      );

      // Should default to supporting variant with min-h-[100px]
      const card = container.querySelector('[class*="min-h-[100px]"]');
      expect(card).toBeInTheDocument();
    });
  });
});
