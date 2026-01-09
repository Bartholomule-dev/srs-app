// tests/component/session/SessionSummary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock supabase client before importing components that use it
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

import { SessionSummary } from '@/components/session';
import type { SessionStats } from '@/lib/session';

// Mock canvas-confetti module - factory must not reference external variables
vi.mock('canvas-confetti', () => {
  const mockFn = vi.fn();
  return {
    default: Object.assign(mockFn, {
      reset: vi.fn(),
    }),
  };
});

// Import the mocked module to access it in tests
import confetti from 'canvas-confetti';
const mockConfetti = confetti as unknown as ReturnType<typeof vi.fn>;

const mockOnDashboard = vi.fn();

const createStats = (overrides: Partial<SessionStats> = {}): SessionStats => ({
  total: 10,
  completed: 10,
  correct: 8,
  incorrect: 2,
  startTime: new Date('2026-01-01T10:00:00Z'),
  endTime: new Date('2026-01-01T10:15:00Z'),
  ...overrides,
});

describe('SessionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfetti.mockClear();
  });

  it('displays correct count in breakdown', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText(/8 correct/)).toBeInTheDocument();
  });

  it('displays incorrect count as "to review"', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText(/2 to review/)).toBeInTheDocument();
  });

  it('calculates and displays accuracy percentage', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays 0% accuracy when no cards completed', () => {
    render(
      <SessionSummary
        stats={createStats({ completed: 0, correct: 0, incorrect: 0 })}
        onDashboard={mockOnDashboard}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays time spent formatted', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    // 15 minutes difference
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('handles missing endTime gracefully', () => {
    render(
      <SessionSummary
        stats={createStats({ endTime: undefined })}
        onDashboard={mockOnDashboard}
      />
    );
    // Should show current duration or fallback - check that Time label exists
    expect(screen.getByText(/time/i)).toBeInTheDocument();
  });

  it('calls onDashboard when button clicked', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(mockOnDashboard).toHaveBeenCalledTimes(1);
  });

  it('shows completion message with celebration emoji', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /celebration/i })).toBeInTheDocument();
  });

  it('displays number of cards reviewed', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/reviewed/i)).toBeInTheDocument();
  });

  describe('encouraging messages', () => {
    it('shows perfect score message and special emoji for 100% accuracy', () => {
      render(
        <SessionSummary
          stats={createStats({ correct: 10, incorrect: 0 })}
          onDashboard={mockOnDashboard}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText(/perfect score/i)).toBeInTheDocument();
      expect(screen.getByText(/flawless/i)).toBeInTheDocument();
    });

    it('shows good work message for 80%+ accuracy', () => {
      render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
      expect(screen.getByText(/great work/i)).toBeInTheDocument();
    });

    it('shows progress message for 60-79% accuracy', () => {
      render(
        <SessionSummary
          stats={createStats({ correct: 6, incorrect: 4 })}
          onDashboard={mockOnDashboard}
        />
      );
      expect(screen.getByText(/good effort/i)).toBeInTheDocument();
    });

    it('shows keep practicing message for under 60% accuracy', () => {
      render(
        <SessionSummary
          stats={createStats({ correct: 5, incorrect: 5 })}
          onDashboard={mockOnDashboard}
        />
      );
      expect(screen.getByText(/keep practicing/i)).toBeInTheDocument();
    });
  });

  describe('confetti celebration', () => {
    it('fires confetti on mount', () => {
      render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
      expect(mockConfetti).toHaveBeenCalled();
    });

    it('fires standard confetti for regular completion', () => {
      render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
      // Standard burst has particleCount of 100
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 100,
        })
      );
    });

    it('fires enhanced confetti for perfect score', () => {
      render(
        <SessionSummary
          stats={createStats({ correct: 10, incorrect: 0 })}
          onDashboard={mockOnDashboard}
        />
      );
      // Perfect score has particleCount of 150
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 150,
        })
      );
    });

    it('includes disableForReducedMotion option', () => {
      render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          disableForReducedMotion: true,
        })
      );
    });
  });
});
