// tests/component/landing/Hero.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/landing';

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

describe('Hero', () => {
  it('renders headline', () => {
    render(<Hero />);
    expect(screen.getByText(/keep your code skills sharp/i)).toBeInTheDocument();
  });

  it('renders subheadline mentioning AI assistants', () => {
    render(<Hero />);
    expect(screen.getByText(/ai assistants/i)).toBeInTheDocument();
  });

  it('renders auth form', () => {
    render(<Hero />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
