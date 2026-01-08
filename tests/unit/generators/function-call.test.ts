// tests/unit/generators/function-call.test.ts
import { describe, it, expect } from 'vitest';
import { functionCallGenerator } from '@/lib/generators/definitions/function-call';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('function-call generator', () => {
  it('has correct name', () => {
    expect(functionCallGenerator.name).toBe('function-call');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = functionCallGenerator.generate(seed);

    expect(params).toHaveProperty('funcName');
    expect(params).toHaveProperty('paramNames');
    expect(params).toHaveProperty('argList');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('context');
    expect(params).toHaveProperty('paramCount');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = functionCallGenerator.generate(seed);
    const params2 = functionCallGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = functionCallGenerator.generate(seed1);
    const params2 = functionCallGenerator.generate(seed2);

    // Extremely unlikely to be the same
    expect(params1.funcName !== params2.funcName || params1.argList !== params2.argList).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = functionCallGenerator.generate(seed);

    expect(functionCallGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid funcName', () => {
    const params = {
      funcName: 'unknown_function',
      argList: '10, 5',
      result: '50',
    };
    expect(functionCallGenerator.validate(params)).toBe(false);
  });

  it('rejects wrong result', () => {
    const params = {
      funcName: 'compute_area',
      paramNames: 'width, height',
      argList: '10, 5',
      result: '100', // Wrong - should be 50
    };
    expect(functionCallGenerator.validate(params)).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = functionCallGenerator.generate(seed);
          return functionCallGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('always includes realistic function names', () => {
      const validNames = [
        'calculate_total',
        'apply_discount',
        'calculate_average',
        'compute_area',
        'get_celsius',
        'calculate_tip',
        'get_percentage',
        'calculate_speed',
      ];

      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = functionCallGenerator.generate(seed);
          return validNames.includes(params.funcName as string);
        }),
        { numRuns: 100 }
      );
    });
  });
});
