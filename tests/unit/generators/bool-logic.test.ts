// tests/unit/generators/bool-logic.test.ts
import { describe, it, expect } from 'vitest';
import { boolLogicGenerator } from '@/lib/generators/definitions/bool-logic';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('bool-logic generator', () => {
  it('has correct name', () => {
    expect(boolLogicGenerator.name).toBe('bool-logic');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = boolLogicGenerator.generate(seed);

    expect(params).toHaveProperty('a');
    expect(params).toHaveProperty('b');
    expect(params).toHaveProperty('expression');
    expect(params).toHaveProperty('expressionTemplate');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = boolLogicGenerator.generate(seed);
    const params2 = boolLogicGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = boolLogicGenerator.generate(seed);

    expect(boolLogicGenerator.validate(params)).toBe(true);
  });

  it('result is True or False', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = boolLogicGenerator.generate(seed);

    expect(['True', 'False']).toContain(params.result);
  });

  it('expression contains actual values', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = boolLogicGenerator.generate(seed);
    const expression = params.expression as string;
    const a = params.a as number;

    // Expression should contain the actual value of a
    expect(expression).toContain(String(a));
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'and_both_true',
      'or_either',
      'not_negative',
      'range_check',
      'equal_or_greater',
      'not_equal',
      'and_with_equal',
      'or_with_zero',
      'compound_and_or',
      'divisibility',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = boolLogicGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = boolLogicGenerator.generate(seed);
          return boolLogicGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('a and b are always in valid range', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = boolLogicGenerator.generate(seed);
          const a = params.a as number;
          const b = params.b as number;
          return a >= 0 && a <= 15 && b >= 0 && b <= 15;
        }),
        { numRuns: 100 }
      );
    });
  });
});
