// tests/component/dashboard/DueCardsBanner.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Supabase client before any imports that might use it
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));

import { DueCardsBanner } from '@/components/dashboard';

const mockOnStartPractice = vi.fn();

describe('DueCardsBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays due count', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it('displays new count', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/new/i)).toBeInTheDocument();
  });

  it('shows start practice button', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    expect(
      screen.getByRole('button', { name: /start practice/i })
    ).toBeInTheDocument();
  });

  it('calls onStartPractice when button clicked', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));
    expect(mockOnStartPractice).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
        loading
      />
    );
    expect(screen.getByRole('button', { name: /start practice/i })).toBeDisabled();
  });

  it('shows total session size', () => {
    render(
      <DueCardsBanner
        dueCount={5}
        newCount={3}
        onStartPractice={mockOnStartPractice}
      />
    );
    // 5 due + 3 new = 8 cards
    expect(screen.getByText(/8 cards/i)).toBeInTheDocument();
  });
});
