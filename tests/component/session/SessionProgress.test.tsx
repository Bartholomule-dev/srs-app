// tests/component/session/SessionProgress.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

import { SessionProgress } from '@/components/session';

describe('SessionProgress', () => {
  // Note: The component displays (current + 1) / total to show which card you're on
  // When current=3, display shows "4 / 10" meaning "you're on card 4 of 10"
  it('displays current card number and total count', () => {
    render(<SessionProgress current={3} total={10} />);
    // current=3 completed means you're on card 4
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
  });

  it('displays correct progress bar percentage', () => {
    render(<SessionProgress current={5} total={10} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles edge case of 0/0', () => {
    render(<SessionProgress current={0} total={0} />);
    // With 0 total, displayCurrent = min(0+1, 0) = 0
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('handles edge case of 1/1 (100%)', () => {
    render(<SessionProgress current={1} total={1} />);
    // current=1 with total=1 means completed, displayCurrent = min(1+1, 1) = 1
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles completed state where current equals total', () => {
    render(<SessionProgress current={10} total={10} />);
    // displayCurrent = min(10+1, 10) = 10
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('displays first card as 1 when starting fresh', () => {
    render(<SessionProgress current={0} total={10} />);
    // current=0 completed means you're on card 1
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SessionProgress current={1} total={5} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  describe('teaching card support', () => {
    it('renders segments with data-segment attribute for testing', () => {
      render(<SessionProgress current={2} total={5} />);

      const progressbar = screen.getByRole('progressbar');
      const segments = progressbar.querySelectorAll('[data-segment]');
      expect(segments.length).toBe(5);
    });

    it('renders blue segments for teaching card types', () => {
      const cardTypes: ('teaching' | 'practice' | 'review')[] = [
        'teaching',
        'practice',
        'review',
        'review',
      ];

      render(<SessionProgress current={1} total={4} cardTypes={cardTypes} />);

      const progressbar = screen.getByRole('progressbar');
      const segments = progressbar.querySelectorAll('[data-segment]');
      expect(segments.length).toBe(4);

      // First segment should be teaching type
      expect(segments[0]).toHaveAttribute('data-segment-type', 'teaching');
      // Others should be practice/review
      expect(segments[1]).toHaveAttribute('data-segment-type', 'practice');
      expect(segments[2]).toHaveAttribute('data-segment-type', 'review');
      expect(segments[3]).toHaveAttribute('data-segment-type', 'review');
    });

    it('defaults to review type when cardTypes not provided', () => {
      render(<SessionProgress current={1} total={3} />);

      const progressbar = screen.getByRole('progressbar');
      const segments = progressbar.querySelectorAll('[data-segment]');

      // All segments should default to review type
      segments.forEach((segment) => {
        expect(segment).toHaveAttribute('data-segment-type', 'review');
      });
    });

    it('applies blue styling to teaching segments', () => {
      const cardTypes: ('teaching' | 'practice' | 'review')[] = [
        'teaching',
        'practice',
      ];

      render(<SessionProgress current={0} total={2} cardTypes={cardTypes} />);

      const progressbar = screen.getByRole('progressbar');
      const segments = progressbar.querySelectorAll('[data-segment]');

      // Teaching segment (first, current) should have blue classes
      const teachingInner = segments[0].querySelector('[data-segment-inner]');
      expect(teachingInner).toHaveClass('bg-blue-500');

      // Practice segment should have accent-primary
      const practiceInner = segments[1].querySelector('[data-segment-inner]');
      expect(practiceInner).not.toHaveClass('bg-blue-500');
    });

    it('applies blue glow to current teaching segment', () => {
      const cardTypes: ('teaching' | 'practice' | 'review')[] = [
        'teaching',
        'teaching',
      ];

      render(<SessionProgress current={1} total={2} cardTypes={cardTypes} />);

      const progressbar = screen.getByRole('progressbar');
      const segments = progressbar.querySelectorAll('[data-segment]');

      // Second segment is current (index 1), should have blue glow
      const currentInner = segments[1].querySelector('[data-segment-inner]');
      expect(currentInner?.className).toContain('shadow-[0_0_8px_rgb(59,130,246)]');
    });
  });
});
