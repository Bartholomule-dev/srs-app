// tests/component/session/SessionSummary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSummary } from '@/components/session';
import type { SessionStats } from '@/lib/session';

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
  });

  it('displays correct count', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/^correct$/i)).toBeInTheDocument();
  });

  it('displays incorrect count', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
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
    // Should show current duration or fallback
    expect(screen.getByText(/time/i)).toBeInTheDocument();
  });

  it('calls onDashboard when button clicked', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(mockOnDashboard).toHaveBeenCalledTimes(1);
  });

  it('shows completion message', () => {
    render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
  });
});
