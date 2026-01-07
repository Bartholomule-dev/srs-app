import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { comparisonLogicGenerator } from '@/lib/generators/definitions/comparison-logic';

describe('comparison-logic generator', () => {
  it('has correct name', () => {
    expect(comparisonLogicGenerator.name).toBe('comparison-logic');
  });

  it('generates valid parameters', () => {
    const params = comparisonLogicGenerator.generate('test-seed');

    expect(params).toHaveProperty('a');
    expect(params).toHaveProperty('b');
    expect(params).toHaveProperty('op');
    expect(params).toHaveProperty('result');
    expect(['<', '>', '==', '!=', '<=', '>=']).toContain(params.op);
    expect(['True', 'False']).toContain(params.result);
  });

  it('computes result correctly', () => {
    const params = comparisonLogicGenerator.generate('fixed-seed');
    const { a, b, op, result } = params;

    let expected: boolean;
    switch (op) {
      case '<': expected = (a as number) < (b as number); break;
      case '>': expected = (a as number) > (b as number); break;
      case '==': expected = (a as number) === (b as number); break;
      case '!=': expected = (a as number) !== (b as number); break;
      case '<=': expected = (a as number) <= (b as number); break;
      case '>=': expected = (a as number) >= (b as number); break;
      default: expected = false;
    }
    expect(result).toBe(expected ? 'True' : 'False');
  });

  it('produces deterministic output', () => {
    const params1 = comparisonLogicGenerator.generate('seed-xyz');
    const params2 = comparisonLogicGenerator.generate('seed-xyz');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5, b: 10, op: '<', result: 'True'
    })).toBe(true);
  });

  it('rejects invalid operator', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5, b: 10, op: '===', result: 'True'
    })).toBe(false);
  });

  it('rejects inconsistent result', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5, b: 10, op: '>', result: 'True'
    })).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = comparisonLogicGenerator.generate(seed);
          return comparisonLogicGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
