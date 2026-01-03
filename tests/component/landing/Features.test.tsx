// tests/component/landing/Features.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Features } from '@/components/landing';

// Mock useAuth to prevent Supabase client initialization when importing from barrel file
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

describe('Features', () => {
  it('renders three feature cards', () => {
    render(<Features />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(3);
  });

  it('mentions spaced repetition', () => {
    render(<Features />);
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument();
  });

  it('mentions code syntax', () => {
    render(<Features />);
    expect(screen.getByText(/code syntax/i)).toBeInTheDocument();
  });

  it('mentions progress tracking', () => {
    render(<Features />);
    // Multiple elements match (title and description), so use getAllByText
    const matches = screen.getAllByText(/track.*progress|progress.*track|streaks/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
