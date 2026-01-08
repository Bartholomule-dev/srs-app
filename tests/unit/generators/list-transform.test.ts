// tests/unit/generators/list-transform.test.ts
import { describe, it, expect } from 'vitest';
import { listTransformGenerator } from '@/lib/generators/definitions/list-transform';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('list-transform generator', () => {
  it('has correct name', () => {
    expect(listTransformGenerator.name).toBe('list-transform');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = listTransformGenerator.generate(seed);

    expect(params).toHaveProperty('inputList');
    expect(params).toHaveProperty('inputStr');
    expect(params).toHaveProperty('outputList');
    expect(params).toHaveProperty('outputStr');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('expression');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('transformType');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = listTransformGenerator.generate(seed);
    const params2 = listTransformGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listTransformGenerator.generate(seed);

    expect(listTransformGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'double_values',
      'square_values',
      'add_constant',
      'filter_evens',
      'filter_odds',
      'filter_greater',
      'sum_all',
      'product_all',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = listTransformGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('produces valid transform types', () => {
    const validTypes = ['map', 'filter', 'reduce'];
    const seed = createSeed('user1', 'test', new Date());
    const params = listTransformGenerator.generate(seed);

    expect(validTypes).toContain(params.transformType);
  });

  it('code contains inputStr', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listTransformGenerator.generate(seed);
    const code = params.code as string;

    // The input list values should appear in the code
    const inputList = params.inputList as number[];
    expect(code).toContain(inputList[0].toString());
  });

  it('code contains print statement', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = listTransformGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('print(');
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listTransformGenerator.generate(seed);
          return listTransformGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('inputList is non-empty array', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listTransformGenerator.generate(seed);
          const inputList = params.inputList as number[];
          return Array.isArray(inputList) && inputList.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('outputStr is non-empty', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = listTransformGenerator.generate(seed);
          const outputStr = params.outputStr as string;
          return typeof outputStr === 'string' && outputStr.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
