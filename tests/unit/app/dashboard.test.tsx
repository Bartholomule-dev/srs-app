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
  Greeting: ({ dueCount, isLoading }: { dueCount: number; isLoading: boolean }) => (
    <div data-testid="greeting">
      Welcome back! {isLoading ? 'Loading...' : `Due: ${dueCount}`}
    </div>
  ),
  StatsGrid: ({ stats, loading }: { stats: unknown; loading: boolean }) => (
    <div data-testid="stats-grid">
      {loading ? 'Loading stats...' : stats ? 'Stats loaded' : 'No stats'}
    </div>
  ),
  SkillTree: () => <div data-testid="skill-tree">Skill Tree</div>,
}));

const mockUseAuth = vi.fn();
const mockUseStats = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useAuth: () => mockUseAuth(),
  useStats: () => mockUseStats(),
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

  it('renders Greeting component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toBeInTheDocument();
    });
  });

  it('passes dueCount to Greeting component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toBeInTheDocument();
      expect(screen.getByText(/Due: 0/)).toBeInTheDocument();
    });
  });

  it('renders SkillTree component', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('skill-tree')).toBeInTheDocument();
    });
  });

  it('renders Your Learning Path section header', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Learning Path')).toBeInTheDocument();
    });
  });
});
