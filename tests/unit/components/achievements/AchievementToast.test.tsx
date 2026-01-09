// tests/unit/components/achievements/AchievementToast.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AchievementToast } from '@/components/achievements/AchievementToast';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';

describe('AchievementToast', () => {
  const firstSteps = ACHIEVEMENTS['first-steps'];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders achievement name and unlock header', () => {
    render(<AchievementToast achievement={firstSteps} />);
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('shows achievement description', () => {
    render(<AchievementToast achievement={firstSteps} />);
    expect(
      screen.getByText('Complete your first graded exercise')
    ).toBeInTheDocument();
  });

  it('shows achievement icon', () => {
    render(<AchievementToast achievement={firstSteps} />);
    expect(screen.getByText('👣')).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(<AchievementToast achievement={firstSteps} onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses after duration', () => {
    const onDismiss = vi.fn();
    render(
      <AchievementToast
        achievement={firstSteps}
        onDismiss={onDismiss}
        duration={1000}
      />
    );

    // Should not be dismissed yet
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance timer past duration
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses default duration of 5000ms', () => {
    const onDismiss = vi.fn();
    render(<AchievementToast achievement={firstSteps} onDismiss={onDismiss} />);

    // Should not be dismissed yet at 4999ms
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // Should be dismissed at 5000ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has alert role for accessibility', () => {
    render(<AchievementToast achievement={firstSteps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dismisses on Escape key', () => {
    const onDismiss = vi.fn();
    render(<AchievementToast achievement={firstSteps} onDismiss={onDismiss} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not crash if onDismiss is not provided', () => {
    render(<AchievementToast achievement={firstSteps} />);

    // Should not throw when clicking close
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(() => fireEvent.click(closeButton)).not.toThrow();

    // Should not throw on Escape
    expect(() => fireEvent.keyDown(document, { key: 'Escape' })).not.toThrow();
  });

  it('shows different achievement icons correctly', () => {
    const { rerender } = render(<AchievementToast achievement={firstSteps} />);
    expect(screen.getByText('👣')).toBeInTheDocument();

    const weekWarrior = ACHIEVEMENTS['week-warrior'];
    rerender(<AchievementToast achievement={weekWarrior} />);
    expect(screen.getByText('🔥')).toBeInTheDocument();

    const century = ACHIEVEMENTS['century'];
    rerender(<AchievementToast achievement={century} />);
    expect(screen.getByText('💯')).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <AchievementToast
        achievement={firstSteps}
        onDismiss={onDismiss}
        duration={5000}
      />
    );

    // Unmount before timer fires
    unmount();

    // Advance timer past duration
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // onDismiss should not be called since component unmounted
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('cleans up keyboard listener on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <AchievementToast achievement={firstSteps} onDismiss={onDismiss} />
    );

    // Unmount component
    unmount();

    // Escape should not call onDismiss after unmount
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
