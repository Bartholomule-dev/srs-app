// tests/unit/generators/list-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { listValuesGenerator } from '@/lib/generators/definitions/list-values';
import { getGenerator, hasGenerator } from '@/lib/generators';

describe('listValuesGenerator', () => {
  it('has correct name', () => {
    expect(listValuesGenerator.name).toBe('list-values');
  });

  describe('generate()', () => {
    it('returns a, b, c parameters', () => {
      const params = listValuesGenerator.generate('test-seed');
      expect(typeof params.a).toBe('number');
      expect(typeof params.b).toBe('number');
      expect(typeof params.c).toBe('number');
    });

    it('generates values in valid range [1, 99]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = listValuesGenerator.generate(seed);
        expect(params.a).toBeGreaterThanOrEqual(1);
        expect(params.a).toBeLessThanOrEqual(99);
        expect(params.b).toBeGreaterThanOrEqual(1);
        expect(params.b).toBeLessThanOrEqual(99);
        expect(params.c).toBeGreaterThanOrEqual(1);
        expect(params.c).toBeLessThanOrEqual(99);
      }
    });

    it('generates distinct values', () => {
      let distinctCount = 0;
      const seeds = Array.from({ length: 100 }, (_, i) => `distinct-${i}`);
      for (const seed of seeds) {
        const params = listValuesGenerator.generate(seed);
        if (params.a !== params.b && params.b !== params.c && params.a !== params.c) {
          distinctCount++;
        }
      }
      // Most seeds should produce distinct values (probabilistically ~97% for [1,99] range)
      expect(distinctCount).toBeGreaterThan(80);
    });

    it('is deterministic', () => {
      const params1 = listValuesGenerator.generate('fixed');
      const params2 = listValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });

    it('produces different values for different seeds', () => {
      const results = Array.from({ length: 10 }, (_, i) =>
        listValuesGenerator.generate(`unique-${i}`)
      );
      const unique = new Set(results.map((r) => `${r.a}-${r.b}-${r.c}`));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(listValuesGenerator.validate({ a: 10, b: 20, c: 30 })).toBe(true);
      expect(listValuesGenerator.validate({ a: 1, b: 50, c: 99 })).toBe(true);
      expect(listValuesGenerator.validate({ a: 99, b: 1, c: 50 })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(listValuesGenerator.validate({ a: 0, b: 20, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: 100, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: 20, c: 0 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: 20, c: 100 })).toBe(false);
    });

    it('returns false for non-numbers', () => {
      expect(listValuesGenerator.validate({ a: '10', b: 20, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: '20', c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: 20, c: '30' })).toBe(false);
    });

    it('returns false for missing params', () => {
      expect(listValuesGenerator.validate({ a: 10, b: 20 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ b: 20, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({})).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = listValuesGenerator.generate(seed);
          return listValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });

    it('values are always in range [1, 99]', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = listValuesGenerator.generate(seed);
          const a = params.a as number;
          const b = params.b as number;
          const c = params.c as number;
          return (
            a >= 1 && a <= 99 &&
            b >= 1 && b <= 99 &&
            c >= 1 && c <= 99
          );
        }),
        { numRuns: 1000 }
      );
    });

    it('same seed always produces same output', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params1 = listValuesGenerator.generate(seed);
          const params2 = listValuesGenerator.generate(seed);
          return (
            params1.a === params2.a &&
            params1.b === params2.b &&
            params1.c === params2.c
          );
        }),
        { numRuns: 500 }
      );
    });
  });
});

describe('list-values registry', () => {
  it('is registered in the registry', () => {
    expect(hasGenerator('list-values')).toBe(true);
  });

  it('getGenerator returns list-values generator', () => {
    const gen = getGenerator('list-values');
    expect(gen).toBeDefined();
    expect(gen?.name).toBe('list-values');
  });
});
