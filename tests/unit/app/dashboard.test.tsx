// tests/unit/app/dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock components and hooks
vi.mock('@/components', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  Header: () => <header data-testid="header">Header</header>,
  DueNowBand: ({ dueCount, streak }: { dueCount: number; streak: number }) => (
    <div data-testid="due-now-band">Due: {dueCount}, Streak: {streak}</div>
  ),
  StatsGrid: ({ stats, loading }: { stats: unknown; loading: boolean }) => (
    <div data-testid="stats-grid">
      {loading ? 'Loading stats...' : stats ? 'Stats loaded' : 'No stats'}
    </div>
  ),
}));

// Mock lazy-loaded components
vi.mock('@/components/skill-tree', () => ({
  SkillTreeLazy: () => <div data-testid="skill-tree">Skill Tree</div>,
}));

vi.mock('@/components/stats', () => ({
  ContributionGraphLazy: ({ loading }: { days: unknown[]; loading: boolean }) => (
    <div data-testid="contribution-graph">
      {loading ? 'Loading contributions...' : 'Contribution Graph'}
    </div>
  ),
}));

vi.mock('@/components/dashboard', () => ({
  RecentAchievementsLazy: () => <div data-testid="recent-achievements">Recent Achievements</div>,
}));

const mockUseAuth = vi.fn();
const mockUseStats = vi.fn();
const mockUseContributionGraph = vi.fn();
const mockUseDueCount = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useAuth: () => mockUseAuth(),
  useStats: () => mockUseStats(),
  useContributionGraph: () => mockUseContributionGraph(),
  useDueCount: () => mockUseDueCount(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
}));

vi.mock('@/lib/supabase/mappers', () => ({
  mapExercise: vi.fn((e) => e),
}));

vi.mock('@/lib/srs', () => ({
  getDueCards: vi.fn(() => []),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, loading: false });
    mockUseStats.mockReturnValue({
      stats: {
        cardsReviewedToday: 10,
        accuracyPercent: 85,
        currentStreak: 7,
        longestStreak: 14,
        totalExercisesCompleted: 150,
      },
      loading: false,
      error: null,
    });
    mockUseContributionGraph.mockReturnValue({
      days: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      currentStreakDays: 0,
    });
    mockUseDueCount.mockReturnValue({
      dueCount: 0,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders StatsGrid component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
    });
  });

  it('shows loading state for stats', async () => {
    mockUseStats.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Loading stats...')).toBeInTheDocument();
    });
  });

  it('renders within ProtectedRoute', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  it('renders within ErrorBoundary', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  it('renders Header component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  it('renders DueNowBand component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('due-now-band')).toBeInTheDocument();
    });
  });

  it('passes dueCount and streak to DueNowBand', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('due-now-band')).toBeInTheDocument();
      expect(screen.getByText(/Due: 0, Streak: 7/)).toBeInTheDocument();
    });
  });

  it('renders SkillTree component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('skill-tree')).toBeInTheDocument();
    });
  });

  it('renders Learning Path section header', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Learning Path')).toBeInTheDocument();
    });
  });

  it('renders Your Progress section header', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });
  });
});
