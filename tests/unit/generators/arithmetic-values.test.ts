// tests/unit/generators/arithmetic-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arithmeticValuesGenerator } from '@/lib/generators/definitions/arithmetic-values';

describe('arithmeticValuesGenerator', () => {
  it('has correct name', () => {
    expect(arithmeticValuesGenerator.name).toBe('arithmetic-values');
  });

  describe('generate()', () => {
    it('returns x and y parameters', () => {
      const params = arithmeticValuesGenerator.generate('test-seed');
      expect(typeof params.x).toBe('number');
      expect(typeof params.y).toBe('number');
    });

    it('generates values in range [1, 20]', () => {
      const seeds = Array.from({ length: 50 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = arithmeticValuesGenerator.generate(seed);
        expect(params.x).toBeGreaterThanOrEqual(1);
        expect(params.x).toBeLessThanOrEqual(20);
        expect(params.y).toBeGreaterThanOrEqual(1);
        expect(params.y).toBeLessThanOrEqual(20);
      }
    });

    it('also generates sum and product', () => {
      const params = arithmeticValuesGenerator.generate('test');
      expect(params.sum).toBe((params.x as number) + (params.y as number));
      expect(params.product).toBe((params.x as number) * (params.y as number));
    });

    it('is deterministic', () => {
      const params1 = arithmeticValuesGenerator.generate('fixed');
      const params2 = arithmeticValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(arithmeticValuesGenerator.validate({ x: 5, y: 10, sum: 15, product: 50 })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(arithmeticValuesGenerator.validate({ x: 0, y: 10, sum: 10, product: 0 })).toBe(false);
    });

    it('returns false for inconsistent sum/product', () => {
      expect(arithmeticValuesGenerator.validate({ x: 5, y: 10, sum: 100, product: 50 })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = arithmeticValuesGenerator.generate(seed);
          return arithmeticValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });

    it('sum and product are always consistent', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = arithmeticValuesGenerator.generate(seed);
          const x = params.x as number;
          const y = params.y as number;
          return params.sum === x + y && params.product === x * y;
        }),
        { numRuns: 500 }
      );
    });
  });
});
