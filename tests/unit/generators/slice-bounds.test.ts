// tests/unit/generators/slice-bounds.test.ts
import { describe, it, expect } from 'vitest';
import { sliceBoundsGenerator } from '@/lib/generators/definitions/slice-bounds';

describe('sliceBoundsGenerator', () => {
  it('has correct name', () => {
    expect(sliceBoundsGenerator.name).toBe('slice-bounds');
  });

  describe('generate()', () => {
    it('returns start and end parameters', () => {
      const params = sliceBoundsGenerator.generate('test-seed');
      expect(typeof params.start).toBe('number');
      expect(typeof params.end).toBe('number');
    });

    it('ensures end > start', () => {
      // Test with multiple seeds to ensure constraint always holds
      const seeds = ['seed-1', 'seed-2', 'seed-3', 'another', 'test'];
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        expect(params.end).toBeGreaterThan(params.start as number);
      }
    });

    it('keeps start in valid range [0, 4]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        expect(params.start).toBeGreaterThanOrEqual(0);
        expect(params.start).toBeLessThanOrEqual(4);
      }
    });

    it('keeps end in valid range [start+1, 7]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `range-${i}`);
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        const end = params.end as number;
        expect(end).toBeGreaterThan(start);
        expect(end).toBeLessThanOrEqual(7);
      }
    });

    it('is deterministic for same seed', () => {
      const params1 = sliceBoundsGenerator.generate('fixed-seed');
      const params2 = sliceBoundsGenerator.generate('fixed-seed');
      expect(params1).toEqual(params2);
    });

    it('produces different values for different seeds', () => {
      // Generate many pairs and verify at least some differ
      const results = Array.from({ length: 10 }, (_, i) =>
        sliceBoundsGenerator.generate(`unique-${i}`)
      );
      const unique = new Set(results.map((r) => `${r.start}-${r.end}`));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(sliceBoundsGenerator.validate({ start: 0, end: 5 })).toBe(true);
      expect(sliceBoundsGenerator.validate({ start: 2, end: 7 })).toBe(true);
      expect(sliceBoundsGenerator.validate({ start: 4, end: 5 })).toBe(true);
    });

    it('returns false when end <= start', () => {
      expect(sliceBoundsGenerator.validate({ start: 5, end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ start: 5, end: 3 })).toBe(false);
    });

    it('returns false when start < 0', () => {
      expect(sliceBoundsGenerator.validate({ start: -1, end: 5 })).toBe(false);
    });

    it('returns false when end > 10', () => {
      expect(sliceBoundsGenerator.validate({ start: 0, end: 11 })).toBe(false);
    });

    it('returns false for non-number values', () => {
      expect(sliceBoundsGenerator.validate({ start: '0', end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ start: 0, end: '5' })).toBe(false);
    });

    it('returns false for missing params', () => {
      expect(sliceBoundsGenerator.validate({ start: 0 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({})).toBe(false);
    });
  });
});
