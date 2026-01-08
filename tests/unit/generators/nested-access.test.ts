// tests/unit/generators/nested-access.test.ts
import { describe, it, expect } from 'vitest';
import { nestedAccessGenerator } from '@/lib/generators/definitions/nested-access';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('nested-access generator', () => {
  it('has correct name', () => {
    expect(nestedAccessGenerator.name).toBe('nested-access');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = nestedAccessGenerator.generate(seed);

    expect(params).toHaveProperty('dataStr');
    expect(params).toHaveProperty('varName');
    expect(params).toHaveProperty('accessExpr');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = nestedAccessGenerator.generate(seed);
    const params2 = nestedAccessGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = nestedAccessGenerator.generate(seed);

    expect(nestedAccessGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'list_of_dicts',
      'dict_of_lists',
      'nested_dict',
      'nested_list',
      'mixed_access',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = nestedAccessGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('accessExpr contains varName', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = nestedAccessGenerator.generate(seed);
    const accessExpr = params.accessExpr as string;
    const varName = params.varName as string;

    expect(accessExpr).toContain(varName);
  });

  it('code contains dataStr', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = nestedAccessGenerator.generate(seed);
    const code = params.code as string;
    const dataStr = params.dataStr as string;

    expect(code).toContain(dataStr);
  });

  it('code contains print statement', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = nestedAccessGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('print(');
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = nestedAccessGenerator.generate(seed);
          return nestedAccessGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('dataStr is non-empty', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = nestedAccessGenerator.generate(seed);
          const dataStr = params.dataStr as string;
          return dataStr.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('result is non-empty', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = nestedAccessGenerator.generate(seed);
          const result = params.result as string;
          return result.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
