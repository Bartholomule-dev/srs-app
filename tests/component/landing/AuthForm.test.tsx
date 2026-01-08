// tests/component/landing/AuthForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '@/components/landing';

const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    loading: false,
    user: null,
  }),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input', () => {
    render(<AuthForm />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('calls signIn with email on submit', async () => {
    render(<AuthForm />);
    const input = screen.getByPlaceholderText(/email/i);
    const button = screen.getByRole('button', { name: /send magic link/i });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after sending', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid email'));
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('disables button while sending', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });
  });

  it('renders Google sign-in button', () => {
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle on Google button click', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce(undefined);
    render(<AuthForm />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('shows error message on Google sign-in failure', async () => {
    mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google auth failed'));
    render(<AuthForm />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(screen.getByText(/google auth failed/i)).toBeInTheDocument();
    });
  });
});
