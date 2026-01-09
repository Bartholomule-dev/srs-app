// tests/unit/paths/utils.test.ts
import { describe, it, expect } from 'vitest';
import { pickRandomItem, pickSeededItem } from '@/lib/paths/utils';

describe('Path Utils', () => {
  describe('pickRandomItem', () => {
    it('returns an item from the array', () => {
      const items = ['a', 'b', 'c'];
      const result = pickRandomItem(items);
      expect(items).toContain(result);
    });

    it('returns undefined for empty array', () => {
      const result = pickRandomItem([]);
      expect(result).toBeUndefined();
    });

    it('works with different types', () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = pickRandomItem(numbers);
      expect(numbers).toContain(result);
    });
  });

  describe('pickSeededItem', () => {
    it('returns deterministic item for same seed', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const seed = 'test-seed-123';

      const result1 = pickSeededItem(items, seed);
      const result2 = pickSeededItem(items, seed);

      expect(result1).toBe(result2);
    });

    it('returns different items for different seeds', () => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const result = pickSeededItem(items, `seed-${i}`);
        if (result) results.add(result);
      }

      // Should have multiple different results
      expect(results.size).toBeGreaterThan(1);
    });

    it('returns undefined for empty array', () => {
      const result = pickSeededItem([], 'any-seed');
      expect(result).toBeUndefined();
    });

    it('returns the single item for single-element array', () => {
      const items = ['only-one'];
      const result = pickSeededItem(items, 'any-seed');
      expect(result).toBe('only-one');
    });

    it('works with complex objects', () => {
      const items = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
      ];
      const seed = 'object-seed';

      const result1 = pickSeededItem(items, seed);
      const result2 = pickSeededItem(items, seed);

      expect(result1).toBe(result2);
      expect(items).toContain(result1);
    });
  });
});
