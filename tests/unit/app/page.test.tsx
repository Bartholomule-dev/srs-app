import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { AuthProvider } from '@/lib/context/AuthContext';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

// Mock landing page components
vi.mock('@/components', () => ({
  LandingHeader: () => <header data-testid="landing-header">Header</header>,
  Hero: () => <section data-testid="hero">Hero with AuthForm</section>,
  Features: () => <section data-testid="features">Features</section>,
  HowItWorks: () => <section data-testid="how-it-works">How It Works</section>,
}));

import { supabase } from '@/lib/supabase/client';

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplace.mockClear();
  });

  it('shows landing page when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-header')).toBeInTheDocument();
    });

    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('features')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state initially', async () => {
    // Use a promise that doesn't resolve immediately to simulate loading
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithAuth(<Home />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders nothing while redirect is in progress', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });

    // After redirect initiated, page renders null (no visible content)
    expect(screen.queryByTestId('landing-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument();
  });
});
