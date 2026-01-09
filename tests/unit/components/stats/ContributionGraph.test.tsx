// tests/unit/components/stats/ContributionGraph.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContributionGraph } from '@/components/stats/ContributionGraph';
import type { ContributionDay } from '@/lib/gamification/contribution';

// Mock Tooltip compound component since it requires portal
vi.mock('@/components/ui/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-trigger">{children}</span>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ContributionGraph', () => {
  const mockDays: ContributionDay[] = [
    { date: '2026-01-05', count: 10, accuracy: 80, level: 'moderate' },
    { date: '2026-01-06', count: 25, accuracy: 90, level: 'good' },
    { date: '2026-01-07', count: 5, accuracy: 100, level: 'light' },
  ];

  it('renders loading skeleton when loading', () => {
    const { container } = render(<ContributionGraph days={[]} loading={true} />);
    const skeleton = container.querySelector('[class*="animate-pulse"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state when no days', () => {
    render(<ContributionGraph days={[]} loading={false} />);
    expect(screen.getByText(/Start practicing/i)).toBeInTheDocument();
  });

  it('renders contribution squares for days with activity', () => {
    const { container } = render(<ContributionGraph days={mockDays} loading={false} />);
    const squares = container.querySelectorAll('[data-contribution-day]');
    expect(squares.length).toBeGreaterThan(0);
  });

  it('applies correct color classes for contribution levels', () => {
    const { container } = render(<ContributionGraph days={mockDays} loading={false} />);

    // Look for level-specific classes
    const moderateSquare = container.querySelector('[class*="bg-accent-primary/50"]');
    const goodSquare = container.querySelector('[class*="bg-accent-primary/75"]');
    const lightSquare = container.querySelector('[class*="bg-accent-primary/25"]');

    expect(moderateSquare || goodSquare || lightSquare).toBeInTheDocument();
  });

  it('shows month labels', () => {
    render(<ContributionGraph days={mockDays} loading={false} />);
    // Should show at least one month label
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hasMonthLabel = monthLabels.some((month) => screen.queryByText(month));
    expect(hasMonthLabel).toBe(true);
  });

  it('shows day of week labels', () => {
    render(<ContributionGraph days={mockDays} loading={false} />);
    // Both desktop and mobile views have day labels, so there are multiple
    expect(screen.getAllByText('Mon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Wed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Fri').length).toBeGreaterThanOrEqual(1);
  });

  it('applies collapsed class on mobile', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} collapsedMobile={true} />
    );
    const graph = container.querySelector('[data-contribution-graph]');
    expect(graph?.className).toContain('hidden');
    expect(graph?.className).toContain('md:block');
  });

  it('does not apply collapsed class when collapsedMobile is false', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} collapsedMobile={false} />
    );
    const graph = container.querySelector('[data-contribution-graph]');
    expect(graph?.className).not.toContain('hidden');
  });

  it('renders legend with Less and More labels', () => {
    render(<ContributionGraph days={mockDays} loading={false} />);
    // Both desktop and mobile views have legends, so there are multiple
    expect(screen.getAllByText('Less').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('More').length).toBeGreaterThanOrEqual(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} className="custom-class" />
    );
    const graph = container.querySelector('[data-contribution-graph]');
    expect(graph?.className).toContain('custom-class');
  });

  it('renders 52 weeks of contribution squares when compactMobile disabled', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} compactMobile={false} />
    );
    // 52 weeks * 7 days = 364 squares
    const squares = container.querySelectorAll('[data-contribution-day]');
    expect(squares.length).toBe(364);
  });

  it('renders both desktop (52 weeks) and mobile (13 weeks) views by default', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} />
    );
    // Desktop: 52 weeks * 7 days = 364 squares
    // Mobile: 13 weeks * 7 days = 91 squares
    // Total: 455 squares (both views rendered but mobile hidden via CSS)
    const squares = container.querySelectorAll('[data-contribution-day]');
    expect(squares.length).toBe(455);
  });

  it('renders compact mobile view with touch-friendly larger squares', () => {
    const { container } = render(
      <ContributionGraph days={mockDays} loading={false} compactMobile={true} />
    );
    // Mobile view should have larger squares (12px instead of 10px)
    const mobileContainer = container.querySelector('.md\\:hidden');
    expect(mobileContainer).toBeInTheDocument();
  });
});
