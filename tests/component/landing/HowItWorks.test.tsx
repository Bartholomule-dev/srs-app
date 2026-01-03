// tests/component/landing/HowItWorks.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/components/landing/HowItWorks';

// Mock useAuth to prevent Supabase client initialization when importing from barrel file
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

describe('HowItWorks', () => {
  it('renders section heading', () => {
    render(<HowItWorks />);
    expect(screen.getByText('How it works')).toBeInTheDocument();
  });

  it('shows step 1 about daily exercises', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/daily exercises/i)).toBeInTheDocument();
  });

  it('shows step 2 about typing code', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/type the code/i)).toBeInTheDocument();
  });

  it('shows step 3 about algorithm adjusting', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/algorithm adjusts/i)).toBeInTheDocument();
  });

  it('displays all three steps', () => {
    render(<HowItWorks />);
    // Check that all three step numbers are rendered
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
