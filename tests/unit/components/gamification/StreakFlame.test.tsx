// tests/unit/components/gamification/StreakFlame.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakFlame } from '@/components/gamification/StreakFlame';

describe('StreakFlame', () => {
  describe('rendering', () => {
    it('renders SVG flame icon', () => {
      render(<StreakFlame streak={1} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toBeInTheDocument();
    });

    it('has data-flame attribute for testing', () => {
      render(<StreakFlame streak={5} />);
      expect(screen.getByTestId('streak-flame')).toHaveAttribute('data-flame');
    });

    it('applies custom className', () => {
      render(<StreakFlame streak={5} className="custom-class" />);
      expect(screen.getByTestId('streak-flame')).toHaveClass('custom-class');
    });
  });

  describe('animation intensity based on streak length', () => {
    it('applies animate-pulse for streak < 7 (gentle animation)', () => {
      render(<StreakFlame streak={3} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-pulse');
    });

    it('applies animate-pulse at streak = 6', () => {
      render(<StreakFlame streak={6} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-pulse');
    });

    it('applies animate-bounce at streak >= 7', () => {
      render(<StreakFlame streak={7} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-bounce');
    });

    it('applies animate-bounce at streak = 15', () => {
      render(<StreakFlame streak={15} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-bounce');
    });

    it('applies animate-bounce at streak = 29', () => {
      render(<StreakFlame streak={29} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-bounce');
    });
  });

  describe('glow effect for long streaks', () => {
    it('does not apply shadow class for streak < 30', () => {
      render(<StreakFlame streak={29} />);
      const flame = screen.getByTestId('streak-flame');
      const svg = flame.querySelector('svg');
      expect(svg).not.toHaveClass('drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]');
    });

    it('applies shadow class for streak >= 30', () => {
      render(<StreakFlame streak={30} />);
      const flame = screen.getByTestId('streak-flame');
      const svg = flame.querySelector('svg');
      expect(svg).toHaveClass('drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]');
    });

    it('applies shadow class for high streak (100 days)', () => {
      render(<StreakFlame streak={100} />);
      const flame = screen.getByTestId('streak-flame');
      const svg = flame.querySelector('svg');
      expect(svg).toHaveClass('drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]');
    });

    it('applies both animate-bounce and shadow at streak >= 30', () => {
      render(<StreakFlame streak={30} />);
      const flame = screen.getByTestId('streak-flame');
      const svg = flame.querySelector('svg');
      expect(svg).toHaveClass('animate-bounce');
      expect(svg).toHaveClass('drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]');
    });
  });

  describe('streak count badge', () => {
    it('does not show streak count by default', () => {
      render(<StreakFlame streak={10} />);
      expect(screen.queryByText('10')).not.toBeInTheDocument();
    });

    it('shows streak count when showCount=true', () => {
      render(<StreakFlame streak={10} showCount />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('shows large streak count with proper formatting', () => {
      render(<StreakFlame streak={365} showCount />);
      expect(screen.getByText('365')).toBeInTheDocument();
    });

    it('streak count has badge styling', () => {
      render(<StreakFlame streak={7} showCount />);
      const badge = screen.getByText('7');
      expect(badge).toHaveClass('font-bold');
    });
  });

  describe('edge cases', () => {
    it('handles streak of 0', () => {
      render(<StreakFlame streak={0} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-pulse');
    });

    it('handles streak of 1', () => {
      render(<StreakFlame streak={1} />);
      const flame = screen.getByTestId('streak-flame');
      expect(flame.querySelector('svg')).toHaveClass('animate-pulse');
    });
  });
});
