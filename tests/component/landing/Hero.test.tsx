// tests/component/landing/Hero.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Hero } from '@/components/landing';

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headline with gradient text', () => {
    render(<Hero />);
    expect(screen.getByText(/keep your/i)).toBeInTheDocument();
    expect(screen.getByText(/code sharp/i)).toBeInTheDocument();
  });

  it('renders badge pill for AI assistant users', () => {
    render(<Hero />);
    expect(screen.getByText(/for developers who use ai assistants/i)).toBeInTheDocument();
  });

  it('renders subheadline with value proposition', () => {
    render(<Hero />);
    expect(screen.getByText(/practice syntax through spaced repetition/i)).toBeInTheDocument();
    expect(screen.getByText(/5 minutes a day to stay fluent/i)).toBeInTheDocument();
  });

  it('renders CTA buttons initially', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: /start free/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /see how it works/i })).toBeInTheDocument();
  });

  it('toggles to auth form when Start Free is clicked', async () => {
    render(<Hero />);

    const startButton = screen.getByRole('button', { name: /start free/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });
  });

  it('toggles back to CTA buttons from auth form', async () => {
    render(<Hero />);

    // Click to show auth form
    fireEvent.click(screen.getByRole('button', { name: /start free/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    // Click back button
    fireEvent.click(screen.getByText(/back to options/i));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start free/i })).toBeInTheDocument();
    });
  });

  it('renders code mockup section on large screens', () => {
    render(<Hero />);
    // The code mockup has exercise.py label
    expect(screen.getByText('exercise.py')).toBeInTheDocument();
  });

  it('has accessible heading structure', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });
});
