// tests/unit/generators/slice-bounds.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sliceBoundsGenerator } from '@/lib/generators/definitions/slice-bounds';
import type { Generator } from '@/lib/generators/types';
import { getGenerator, registerGenerator, hasGenerator } from '@/lib/generators';

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

describe('sliceBoundsGenerator property tests', () => {
  it('always produces valid params for any seed', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        return sliceBoundsGenerator.validate(params);
      }),
      { numRuns: 1000 }
    );
  });

  it('always satisfies end > start constraint', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        const end = params.end as number;
        return end > start;
      }),
      { numRuns: 1000 }
    );
  });

  it('start is always in [0, 4]', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        return start >= 0 && start <= 4;
      }),
      { numRuns: 1000 }
    );
  });

  it('end is always in [1, 7]', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const end = params.end as number;
        return end >= 1 && end <= 7;
      }),
      { numRuns: 1000 }
    );
  });

  it('same seed always produces same output', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params1 = sliceBoundsGenerator.generate(seed);
        const params2 = sliceBoundsGenerator.generate(seed);
        return params1.start === params2.start && params1.end === params2.end;
      }),
      { numRuns: 500 }
    );
  });
});

describe('Generator registry', () => {
  it('slice-bounds is registered', () => {
    expect(hasGenerator('slice-bounds')).toBe(true);
  });

  it('getGenerator returns slice-bounds generator', () => {
    const gen = getGenerator('slice-bounds');
    expect(gen).toBeDefined();
    expect(gen?.name).toBe('slice-bounds');
  });

  it('getGenerator returns undefined for unknown generator', () => {
    const gen = getGenerator('non-existent');
    expect(gen).toBeUndefined();
  });

  it('registerGenerator adds new generator', () => {
    const testGen: Generator = {
      name: 'test-gen',
      generate: () => ({ value: 1 }),
      validate: () => true,
    };
    registerGenerator(testGen);
    expect(hasGenerator('test-gen')).toBe(true);
    expect(getGenerator('test-gen')).toBe(testGen);
  });
});
