import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContributionGraph } from '@/components/stats/ContributionGraph';
import type { ContributionDay } from '@/lib/gamification/contribution';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Generate sample days for testing
function generateTestDays(count: number): ContributionDay[] {
  const days: ContributionDay[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 20),
      accuracy: Math.floor(Math.random() * 100),
      level: ['none', 'light', 'moderate', 'good', 'strong'][Math.floor(Math.random() * 5)] as ContributionDay['level'],
    });
  }

  return days;
}

describe('ContributionGraph mobile responsiveness', () => {
  describe('mobileWeeks prop', () => {
    it('should use default mobileWeeks of 13 when not specified', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      // Default 13 weeks = 91 days max
      const mobileDays = mobileGraph.querySelectorAll('[data-contribution-day]');
      expect(mobileDays.length).toBeLessThanOrEqual(13 * 7);
    });

    it('should limit mobile view to specified mobileWeeks', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} mobileWeeks={8} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      const mobileDays = mobileGraph.querySelectorAll('[data-contribution-day]');
      // 8 weeks = 56 days max
      expect(mobileDays.length).toBeLessThanOrEqual(8 * 7);
    });

    it('should show full 52 weeks on desktop regardless of mobileWeeks', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} mobileWeeks={8} />);

      const desktopGraph = screen.getByTestId('desktop-graph');
      const desktopDays = desktopGraph.querySelectorAll('[data-contribution-day]');
      // Desktop should always show 52 weeks
      expect(desktopDays.length).toBeGreaterThan(8 * 7);
      expect(desktopDays.length).toBeLessThanOrEqual(52 * 7);
    });
  });

  describe('data attributes for responsive switching', () => {
    it('should have data-mobile-graph attribute on mobile view', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} />);

      expect(screen.getByTestId('mobile-graph')).toBeInTheDocument();
    });

    it('should have data-desktop-graph attribute on desktop view', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} />);

      expect(screen.getByTestId('desktop-graph')).toBeInTheDocument();
    });

    it('should have both mobile and desktop views when compactMobile is true', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} compactMobile={true} />);

      expect(screen.getByTestId('mobile-graph')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-graph')).toBeInTheDocument();
    });

    it('should hide mobile view when compactMobile is false', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} compactMobile={false} />);

      expect(screen.queryByTestId('mobile-graph')).not.toBeInTheDocument();
      expect(screen.getByTestId('desktop-graph')).toBeInTheDocument();
    });
  });

  describe('collapsedLabels prop', () => {
    it('should show all month labels when collapsedLabels is false', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} collapsedLabels={false} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      const monthLabels = mobileGraph.querySelectorAll('[data-month-label]');
      // With 13 weeks, we could have up to 4 different months
      expect(monthLabels.length).toBeGreaterThan(0);
    });

    it('should limit month labels to 4 or fewer when collapsedLabels is true', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} collapsedLabels={true} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      const monthLabels = mobileGraph.querySelectorAll('[data-month-label]');
      expect(monthLabels.length).toBeLessThanOrEqual(4);
    });

    it('should default collapsedLabels to true on mobile view', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      const monthLabels = mobileGraph.querySelectorAll('[data-month-label]');
      // Should have collapsed labels by default on mobile
      expect(monthLabels.length).toBeLessThanOrEqual(4);
    });

    it('should not collapse labels on desktop view', () => {
      const days = generateTestDays(365);
      render(<ContributionGraph days={days} loading={false} collapsedLabels={true} />);

      const desktopGraph = screen.getByTestId('desktop-graph');
      const monthLabels = desktopGraph.querySelectorAll('[data-month-label]');
      // Desktop should show all month labels (up to 12 for full year)
      // At minimum, 52 weeks spans at least 12 months
      expect(monthLabels.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('responsive Tailwind classes', () => {
    it('should have hidden class on desktop view for mobile display', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} compactMobile={true} />);

      const desktopGraph = screen.getByTestId('desktop-graph');
      // Desktop should be hidden on mobile, shown on md+
      expect(desktopGraph.className).toMatch(/hidden.*md:block|md:block.*hidden/);
    });

    it('should have md:hidden class on mobile view', () => {
      const days = generateTestDays(100);
      render(<ContributionGraph days={days} loading={false} compactMobile={true} />);

      const mobileGraph = screen.getByTestId('mobile-graph');
      // Mobile should be visible by default, hidden on md+
      expect(mobileGraph.className).toContain('md:hidden');
    });
  });

  describe('loading and empty states', () => {
    it('should show skeleton when loading', () => {
      render(<ContributionGraph days={[]} loading={true} />);

      // Should not have mobile/desktop graphs when loading
      expect(screen.queryByTestId('mobile-graph')).not.toBeInTheDocument();
      expect(screen.queryByTestId('desktop-graph')).not.toBeInTheDocument();
    });

    it('should show empty state message when no days', () => {
      render(<ContributionGraph days={[]} loading={false} />);

      expect(screen.getByText(/start practicing/i)).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-graph')).not.toBeInTheDocument();
    });
  });
});
