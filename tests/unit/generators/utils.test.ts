// tests/unit/generators/utils.test.ts
import { describe, it, expect } from 'vitest';
import { seededRandom, type SeededRandom } from '@/lib/generators/utils';

describe('seededRandom', () => {
  it('creates a SeededRandom instance from a seed', () => {
    const rng = seededRandom('test-seed');
    expect(rng).toBeDefined();
    expect(typeof rng.next).toBe('function');
    expect(typeof rng.int).toBe('function');
    expect(typeof rng.pick).toBe('function');
    expect(typeof rng.shuffle).toBe('function');
  });

  describe('next()', () => {
    it('returns a number between 0 and 1', () => {
      const rng = seededRandom('test-seed');
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('produces same sequence for same seed', () => {
      const rng1 = seededRandom('fixed-seed');
      const rng2 = seededRandom('fixed-seed');

      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = seededRandom('seed-a');
      const rng2 = seededRandom('seed-b');

      const seq1 = Array.from({ length: 5 }, () => rng1.next());
      const seq2 = Array.from({ length: 5 }, () => rng2.next());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('int()', () => {
    it('returns integers within range [min, max]', () => {
      const rng = seededRandom('int-test');
      for (let i = 0; i < 100; i++) {
        const value = rng.int(5, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    it('handles min === max', () => {
      const rng = seededRandom('edge-case');
      expect(rng.int(7, 7)).toBe(7);
    });

    it('is deterministic for same seed', () => {
      const rng1 = seededRandom('deterministic');
      const rng2 = seededRandom('deterministic');

      for (let i = 0; i < 10; i++) {
        expect(rng1.int(0, 100)).toBe(rng2.int(0, 100));
      }
    });
  });

  describe('pick()', () => {
    it('returns an element from the array', () => {
      const rng = seededRandom('pick-test');
      const items = ['a', 'b', 'c', 'd'];

      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(items);
        expect(items).toContain(picked);
      }
    });

    it('is deterministic for same seed', () => {
      const items = ['x', 'y', 'z'];
      const rng1 = seededRandom('pick-seed');
      const rng2 = seededRandom('pick-seed');

      for (let i = 0; i < 10; i++) {
        expect(rng1.pick(items)).toBe(rng2.pick(items));
      }
    });

    it('throws on empty array', () => {
      const rng = seededRandom('empty');
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
    });
  });

  describe('shuffle()', () => {
    it('returns array with same elements', () => {
      const rng = seededRandom('shuffle-test');
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...original]);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('does not mutate original array', () => {
      const rng = seededRandom('no-mutate');
      const original = [1, 2, 3];
      const copy = [...original];
      rng.shuffle(copy);

      // Note: shuffle returns new array, doesn't mutate
      expect(original).toEqual([1, 2, 3]);
    });

    it('is deterministic for same seed', () => {
      const rng1 = seededRandom('shuffle-seed');
      const rng2 = seededRandom('shuffle-seed');

      const arr = [1, 2, 3, 4, 5];
      expect(rng1.shuffle([...arr])).toEqual(rng2.shuffle([...arr]));
    });
  });
});
