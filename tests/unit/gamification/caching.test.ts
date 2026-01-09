import { describe, it, expect } from 'vitest';
import {
  gamificationQueryKeys,
  getStaleTime,
} from '@/lib/gamification/query-keys';

describe('gamificationQueryKeys', () => {
  describe('points', () => {
    it('returns correct query key array', () => {
      expect(gamificationQueryKeys.points('user-1')).toEqual([
        'gamification',
        'points',
        'user-1',
      ]);
    });

    it('includes userId in the key', () => {
      const key = gamificationQueryKeys.points('abc-123');
      expect(key).toContain('abc-123');
    });
  });

  describe('contributions', () => {
    it('returns correct query key array', () => {
      expect(gamificationQueryKeys.contributions('user-1')).toEqual([
        'gamification',
        'contributions',
        'user-1',
      ]);
    });

    it('includes userId in the key', () => {
      const key = gamificationQueryKeys.contributions('xyz-456');
      expect(key).toContain('xyz-456');
    });
  });

  describe('achievements', () => {
    it('returns correct query key array', () => {
      expect(gamificationQueryKeys.achievements('user-1')).toEqual([
        'gamification',
        'achievements',
        'user-1',
      ]);
    });

    it('includes userId in the key', () => {
      const key = gamificationQueryKeys.achievements('def-789');
      expect(key).toContain('def-789');
    });
  });

  describe('streak', () => {
    it('returns correct query key array', () => {
      expect(gamificationQueryKeys.streak('user-1')).toEqual([
        'gamification',
        'streak',
        'user-1',
      ]);
    });

    it('includes userId in the key', () => {
      const key = gamificationQueryKeys.streak('ghi-012');
      expect(key).toContain('ghi-012');
    });
  });

  describe('all keys share gamification prefix', () => {
    it('all keys start with gamification', () => {
      const userId = 'test-user';
      expect(gamificationQueryKeys.points(userId)[0]).toBe('gamification');
      expect(gamificationQueryKeys.contributions(userId)[0]).toBe(
        'gamification'
      );
      expect(gamificationQueryKeys.achievements(userId)[0]).toBe(
        'gamification'
      );
      expect(gamificationQueryKeys.streak(userId)[0]).toBe('gamification');
    });
  });
});

describe('getStaleTime', () => {
  describe('contributions', () => {
    it('returns 5 minutes (300000ms)', () => {
      expect(getStaleTime('contributions')).toBe(5 * 60 * 1000);
    });

    it('returns exactly 300000', () => {
      expect(getStaleTime('contributions')).toBe(300000);
    });
  });

  describe('achievements', () => {
    it('returns 1 minute (60000ms)', () => {
      expect(getStaleTime('achievements')).toBe(60 * 1000);
    });

    it('returns exactly 60000', () => {
      expect(getStaleTime('achievements')).toBe(60000);
    });
  });

  describe('points', () => {
    it('returns 0 (always fresh)', () => {
      expect(getStaleTime('points')).toBe(0);
    });
  });

  describe('streak', () => {
    it('returns 1 minute (60000ms)', () => {
      expect(getStaleTime('streak')).toBe(60 * 1000);
    });

    it('returns exactly 60000', () => {
      expect(getStaleTime('streak')).toBe(60000);
    });
  });

  describe('type safety', () => {
    it('only accepts valid query types', () => {
      // These should compile without errors
      getStaleTime('points');
      getStaleTime('contributions');
      getStaleTime('achievements');
      getStaleTime('streak');

      // TypeScript would catch invalid types at compile time
      // @ts-expect-error - invalid type should error
      getStaleTime('invalid');
    });
  });
});
