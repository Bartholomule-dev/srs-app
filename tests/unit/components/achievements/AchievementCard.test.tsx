// tests/unit/components/achievements/AchievementCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementCard } from '@/components/achievements/AchievementCard';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';

describe('AchievementCard', () => {
  const firstSteps = ACHIEVEMENTS['first-steps'];

  it('renders achievement name and description', () => {
    render(<AchievementCard achievement={firstSteps} />);
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Complete your first graded exercise')).toBeInTheDocument();
  });

  it('shows locked state by default', () => {
    render(<AchievementCard achievement={firstSteps} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows unlocked state when unlocked', () => {
    render(<AchievementCard achievement={firstSteps} unlocked />);
    expect(screen.queryByText('Locked')).not.toBeInTheDocument();
  });

  it('displays unlock date when provided', () => {
    const date = '2026-01-08T12:00:00Z';
    render(<AchievementCard achievement={firstSteps} unlocked unlockedAt={date} />);
    expect(screen.getByText(/Jan 8/)).toBeInTheDocument();
  });

  it('shows category badge', () => {
    render(<AchievementCard achievement={firstSteps} />);
    expect(screen.getByText('habit')).toBeInTheDocument();
  });

  it('shows icon', () => {
    render(<AchievementCard achievement={firstSteps} />);
    expect(screen.getByText(firstSteps.icon)).toBeInTheDocument();
  });

  it('applies grayscale filter when locked', () => {
    const { container } = render(<AchievementCard achievement={firstSteps} />);
    const iconElement = container.querySelector('[class*="grayscale"]');
    expect(iconElement).toBeInTheDocument();
  });

  it('does not apply grayscale filter when unlocked', () => {
    const { container } = render(<AchievementCard achievement={firstSteps} unlocked />);
    const iconElement = container.querySelector('[class*="grayscale"]');
    expect(iconElement).not.toBeInTheDocument();
  });

  it('shows mastery category badge for mastery achievements', () => {
    const bronzeAge = ACHIEVEMENTS['bronze-age'];
    render(<AchievementCard achievement={bronzeAge} />);
    expect(screen.getByText('mastery')).toBeInTheDocument();
  });

  it('shows completionist category badge for completionist achievements', () => {
    const century = ACHIEVEMENTS['century'];
    render(<AchievementCard achievement={century} />);
    expect(screen.getByText('completionist')).toBeInTheDocument();
  });
});
