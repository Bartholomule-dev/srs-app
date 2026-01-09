import { describe, it, expect } from 'vitest';
import * as gamification from '@/lib/gamification';

describe('Gamification barrel export', () => {
  it('exports type-related constants', () => {
    expect(gamification.QUALITY_BONUS).toBeDefined();
    expect(gamification.STREAK_MULTIPLIERS).toBeDefined();
    expect(gamification.POINTS).toBeDefined();
    expect(gamification.STREAK_FREEZE).toBeDefined();
  });
});
