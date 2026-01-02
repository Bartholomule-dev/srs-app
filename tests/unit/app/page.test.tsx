import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

import { supabase } from '@/lib/supabase/client';

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login form when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('shows user info when authenticated', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signIn when form is submitted', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as any);

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });
  });

  it('calls signOut when sign out button is clicked', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
