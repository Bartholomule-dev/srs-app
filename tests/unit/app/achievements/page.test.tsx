// tests/unit/app/achievements/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementsPage from '@/app/achievements/page';
import { ACHIEVEMENTS, getAchievementsByCategory } from '@/lib/gamification/achievements';

// Mock components
vi.mock('@/components', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock AchievementCard
vi.mock('@/components/achievements/AchievementCard', () => ({
  AchievementCard: ({ achievement, unlocked }: { achievement: { name: string }; unlocked: boolean }) => (
    <div data-testid={`achievement-card-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`}>
      {achievement.name} - {unlocked ? 'Unlocked' : 'Locked'}
    </div>
  ),
}));

// Mock the hook
const mockUseAchievements = vi.fn();
vi.mock('@/lib/hooks/useAchievements', () => ({
  useAchievements: () => mockUseAchievements(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('shows progress indicator with correct count', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 5,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    // Look for "5 / 18" or similar pattern
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/18/)).toBeInTheDocument();
  });

  it('renders all 3 category sections', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    expect(screen.getByText('Habit')).toBeInTheDocument();
    expect(screen.getByText('Mastery')).toBeInTheDocument();
    expect(screen.getByText('Completionist')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: true,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders AchievementCard for each achievement', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);

    // Check that at least some achievement cards are rendered
    const habitAchievements = getAchievementsByCategory('habit');
    habitAchievements.forEach((achievement) => {
      const testId = `achievement-card-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`;
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('renders within ProtectedRoute', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });

  it('renders Header component', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('passes unlocked status to AchievementCard', () => {
    const unlockedSlugs = ['first-steps', 'week-warrior'];
    mockUseAchievements.mockReturnValue({
      achievements: unlockedSlugs.map((slug) => ({
        achievementSlug: slug,
        unlockedAt: '2026-01-08T12:00:00Z',
      })),
      unlockedCount: 2,
      loading: false,
      error: null,
      isUnlocked: (slug: string) => unlockedSlugs.includes(slug),
      getUnlockedAt: (slug: string) =>
        unlockedSlugs.includes(slug) ? '2026-01-08T12:00:00Z' : null,
    });

    render(<AchievementsPage />);

    // First Steps should be unlocked
    expect(screen.getByTestId('achievement-card-first-steps')).toHaveTextContent('Unlocked');
    // Century should be locked
    expect(screen.getByTestId('achievement-card-century')).toHaveTextContent('Locked');
  });

  it('renders category descriptions', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);

    // Check for category description text
    expect(screen.getByText(/consistency/i)).toBeInTheDocument(); // Habit description
  });

  it('displays correct total achievement count', () => {
    mockUseAchievements.mockReturnValue({
      achievements: [],
      unlockedCount: 0,
      loading: false,
      error: null,
      isUnlocked: () => false,
      getUnlockedAt: () => null,
    });

    render(<AchievementsPage />);

    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    expect(screen.getByText(new RegExp(String(totalAchievements)))).toBeInTheDocument();
  });
});
