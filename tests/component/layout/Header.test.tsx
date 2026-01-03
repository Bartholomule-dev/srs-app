// tests/component/layout/Header.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout';
import type { UserStats } from '@/lib/stats';

// Mock useAuth hook
const mockSignOut = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    signOut: mockSignOut,
    loading: false,
  }),
}));

// Mock useStats hook
vi.mock('@/lib/hooks/useStats', () => ({
  useStats: () => ({
    stats: {
      currentStreak: 5,
      cardsReviewedToday: 12,
      accuracyPercent: 85,
      longestStreak: 10,
      totalExercisesCompleted: 50,
    } as UserStats,
    loading: false,
    error: null,
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo that links to dashboard', () => {
    render(<Header />);
    const logo = screen.getByRole('link', { name: /syntaxsrs/i });
    expect(logo).toHaveAttribute('href', '/dashboard');
  });

  it('displays current streak with fire icon', () => {
    render(<Header />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });

  it('displays cards reviewed today', () => {
    render(<Header />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/today/i)).toBeInTheDocument();
  });

  it('shows user menu with email', () => {
    render(<Header />);
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('calls signOut when sign out clicked', async () => {
    render(<Header />);
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
