// tests/unit/generators/dict-comp.test.ts
import { describe, it, expect } from 'vitest';
import { dictCompGenerator } from '@/lib/generators/definitions/dict-comp';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('dict-comp generator', () => {
  it('has correct name', () => {
    expect(dictCompGenerator.name).toBe('dict-comp');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = dictCompGenerator.generate(seed);

    expect(params).toHaveProperty('n');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('result');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = dictCompGenerator.generate(seed);
    const params2 = dictCompGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = dictCompGenerator.generate(seed1);
    const params2 = dictCompGenerator.generate(seed2);

    expect(
      params1.scenario !== params2.scenario || params1.n !== params2.n
    ).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = dictCompGenerator.generate(seed);

    expect(dictCompGenerator.validate(params)).toBe(true);
  });

  it('produces valid range values', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = dictCompGenerator.generate(seed);

    expect(params.n).toBeGreaterThanOrEqual(3);
    expect(params.n).toBeLessThanOrEqual(6);
  });

  it('produces valid scenario names', () => {
    const validScenarios = ['squares', 'cubes', 'doubles', 'even_only', 'string_keys'];
    const seed = createSeed('user1', 'test', new Date());
    const params = dictCompGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = dictCompGenerator.generate(seed);
          return dictCompGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('result is always valid JSON-like dict string', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = dictCompGenerator.generate(seed);
          const result = params.result as string;
          // Should start with { and end with }
          return result.startsWith('{') && result.endsWith('}');
        }),
        { numRuns: 100 }
      );
    });
  });
});
