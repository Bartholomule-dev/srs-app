// tests/unit/components/gamification/PointsAnimation.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PointsAnimation } from '@/components/gamification/PointsAnimation';

describe('PointsAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders points with + prefix for positive values', () => {
    render(<PointsAnimation points={15} />);
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('renders 0 points without + prefix', () => {
    render(<PointsAnimation points={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders large numbers with locale formatting', () => {
    render(<PointsAnimation points={1500} />);
    expect(screen.getByText('+1,500')).toBeInTheDocument();
  });

  it('applies success variant styling by default', () => {
    render(<PointsAnimation points={10} />);
    const element = screen.getByText('+10');
    expect(element).toHaveClass('text-accent-success');
  });

  it('applies success variant styling explicitly', () => {
    render(<PointsAnimation points={10} variant="success" />);
    const element = screen.getByText('+10');
    expect(element).toHaveClass('text-accent-success');
  });

  it('applies neutral variant styling', () => {
    render(<PointsAnimation points={10} variant="neutral" />);
    const element = screen.getByText('+10');
    expect(element).toHaveClass('text-text-secondary');
  });

  it('calls onComplete after animation (1000ms)', () => {
    const onComplete = vi.fn();
    render(<PointsAnimation points={20} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not render when show is false', () => {
    render(<PointsAnimation points={15} show={false} />);
    expect(screen.queryByText('+15')).not.toBeInTheDocument();
  });

  it('renders when show is true', () => {
    render(<PointsAnimation points={15} show={true} />);
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PointsAnimation points={10} className="custom-class" />);
    const element = screen.getByText('+10');
    expect(element).toHaveClass('custom-class');
  });

  it('has font-mono and font-bold classes for styling', () => {
    render(<PointsAnimation points={10} />);
    const element = screen.getByText('+10');
    expect(element).toHaveClass('font-mono');
    expect(element).toHaveClass('font-bold');
  });

  it('does not call onComplete when show is false', () => {
    const onComplete = vi.fn();
    render(<PointsAnimation points={20} show={false} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<PointsAnimation points={20} onComplete={onComplete} />);

    // Unmount before timer fires
    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
