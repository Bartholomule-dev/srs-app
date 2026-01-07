// tests/unit/generators/index-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { indexValuesGenerator } from '@/lib/generators/definitions/index-values';
import { getGenerator, hasGenerator } from '@/lib/generators';

describe('indexValuesGenerator', () => {
  it('has correct name', () => {
    expect(indexValuesGenerator.name).toBe('index-values');
  });

  describe('generate()', () => {
    it('returns idx parameter', () => {
      const params = indexValuesGenerator.generate('test-seed');
      expect(typeof params.idx).toBe('number');
    });

    it('generates index in range [0, 4]', () => {
      const seeds = Array.from({ length: 50 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = indexValuesGenerator.generate(seed);
        expect(params.idx).toBeGreaterThanOrEqual(0);
        expect(params.idx).toBeLessThanOrEqual(4);
      }
    });

    it('is deterministic', () => {
      const params1 = indexValuesGenerator.generate('fixed');
      const params2 = indexValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });

    it('produces different values for different seeds', () => {
      // Generate many values and verify at least some differ
      const results = Array.from({ length: 20 }, (_, i) =>
        indexValuesGenerator.generate(`unique-${i}`)
      );
      const unique = new Set(results.map((r) => `${r.idx}`));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('validate()', () => {
    it('returns true for valid index', () => {
      expect(indexValuesGenerator.validate({ idx: 0 })).toBe(true);
      expect(indexValuesGenerator.validate({ idx: 2 })).toBe(true);
      expect(indexValuesGenerator.validate({ idx: 4 })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(indexValuesGenerator.validate({ idx: -1 })).toBe(false);
      expect(indexValuesGenerator.validate({ idx: 5 })).toBe(false);
    });

    it('returns false for non-integer', () => {
      expect(indexValuesGenerator.validate({ idx: 1.5 })).toBe(false);
      expect(indexValuesGenerator.validate({ idx: '2' })).toBe(false);
    });

    it('returns false for missing idx', () => {
      expect(indexValuesGenerator.validate({})).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = indexValuesGenerator.generate(seed);
          return indexValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });

    it('idx is always in [0, 4]', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = indexValuesGenerator.generate(seed);
          const idx = params.idx as number;
          return idx >= 0 && idx <= 4;
        }),
        { numRuns: 500 }
      );
    });

    it('same seed always produces same output', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params1 = indexValuesGenerator.generate(seed);
          const params2 = indexValuesGenerator.generate(seed);
          return params1.idx === params2.idx;
        }),
        { numRuns: 500 }
      );
    });
  });
});

describe('index-values registry', () => {
  it('is registered in generator registry', () => {
    expect(hasGenerator('index-values')).toBe(true);
  });

  it('getGenerator returns the correct generator', () => {
    const gen = getGenerator('index-values');
    expect(gen).toBeDefined();
    expect(gen?.name).toBe('index-values');
  });
});
