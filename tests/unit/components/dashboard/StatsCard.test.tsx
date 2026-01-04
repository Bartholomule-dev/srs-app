// tests/unit/components/dashboard/StatsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard, ProgressRing } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Streak" value={7} />);

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<StatsCard label="Accuracy" value={85} suffix="%" />);

    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    // Value and suffix are separate spans now
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

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without icon when not provided', () => {
    const { container } = render(<StatsCard label="Streak" value={7} />);

    // Should not have any SVG icons when no icon prop
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('handles decimal values', () => {
    render(<StatsCard label="Average" value={3.14} />);
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('renders positive trend indicator', () => {
    render(<StatsCard label="Total" value={100} trend={5} />);

    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('renders negative trend indicator', () => {
    render(<StatsCard label="Total" value={100} trend={-3} />);

    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('does not render trend when value is 0', () => {
    render(<StatsCard label="Total" value={100} trend={0} />);

    expect(screen.queryByText('+0')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders progress ring when showRing is true', () => {
    const { container } = render(
      <StatsCard label="Accuracy" value={75} showRing />
    );

    // Should have SVG for the progress ring
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Progress ring has circles for background and progress
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
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
});

describe('ProgressRing', () => {
  it('renders with default props', () => {
    const { container } = render(<ProgressRing value={50} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('renders with custom size', () => {
    const { container } = render(<ProgressRing value={50} size={64} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('renders background and progress circles', () => {
    const { container } = render(<ProgressRing value={75} />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });

  it('clamps value at 100', () => {
    const { container } = render(<ProgressRing value={150} />);

    // Should still render without errors
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles 0 value', () => {
    const { container } = render(<ProgressRing value={0} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressRing value={50} className="custom-ring" />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-ring');
  });
});
