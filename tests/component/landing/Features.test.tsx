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
  it('renders all feature titles', () => {
    render(<Features />);
    expect(screen.getByText('Spaced Repetition')).toBeInTheDocument();
    expect(screen.getByText('Code Syntax Focus')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
  });

  it('renders three feature cards with headings', () => {
    render(<Features />);
    const featureHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(featureHeadings).toHaveLength(3);
  });

  it('renders section header', () => {
    render(<Features />);
    expect(screen.getByRole('heading', { level: 2, name: /why syntaxsrs/i })).toBeInTheDocument();
    expect(
      screen.getByText(/built specifically for developers who want to maintain their syntax fluency/i)
    ).toBeInTheDocument();
  });

  it('has id="features" for anchor link', () => {
    const { container } = render(<Features />);
    const section = container.querySelector('section#features');
    expect(section).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(<Features />);
    expect(screen.getByRole('button', { name: /try free/i })).toBeInTheDocument();
  });

  it('renders CTA card with "Ready to start?" text', () => {
    render(<Features />);
    expect(screen.getByText(/ready to start/i)).toBeInTheDocument();
  });

  it('mentions spaced repetition in description', () => {
    render(<Features />);
    expect(screen.getByText(/science-backed algorithm/i)).toBeInTheDocument();
  });

  it('mentions code syntax in description', () => {
    render(<Features />);
    expect(screen.getByText(/practice real programming patterns/i)).toBeInTheDocument();
  });

  it('mentions progress tracking in description', () => {
    render(<Features />);
    expect(screen.getByText(/build consistency with daily streaks/i)).toBeInTheDocument();
  });
});
