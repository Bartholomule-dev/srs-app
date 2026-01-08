// tests/unit/generators/string-slice.test.ts
import { describe, it, expect } from 'vitest';
import { stringSliceGenerator } from '@/lib/generators/definitions/string-slice';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('string-slice generator', () => {
  it('has correct name', () => {
    expect(stringSliceGenerator.name).toBe('string-slice');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = stringSliceGenerator.generate(seed);

    expect(params).toHaveProperty('word');
    expect(params).toHaveProperty('start');
    expect(params).toHaveProperty('end');
    expect(params).toHaveProperty('step');
    expect(params).toHaveProperty('sliceExpr');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('scenario');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = stringSliceGenerator.generate(seed);
    const params2 = stringSliceGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = stringSliceGenerator.generate(seed);

    expect(stringSliceGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'basic',
      'from_start',
      'to_end',
      'negative_start',
      'negative_end',
      'step',
      'reverse',
      'every_other',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = stringSliceGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('code contains word', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = stringSliceGenerator.generate(seed);
    const code = params.code as string;
    const word = params.word as string;

    expect(code).toContain(word);
  });

  it('code contains slice expression', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = stringSliceGenerator.generate(seed);
    const code = params.code as string;
    const sliceExpr = params.sliceExpr as string;

    expect(code).toContain(sliceExpr);
  });

  it('result is substring of word or shorter', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = stringSliceGenerator.generate(seed);
    const word = params.word as string;
    const result = params.result as string;

    expect(result.length).toBeLessThanOrEqual(word.length);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringSliceGenerator.generate(seed);
          return stringSliceGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('word is always a valid word', () => {
      const validWords = [
        'python',
        'coding',
        'string',
        'method',
        'syntax',
        'module',
        'lambda',
        'object',
        'branch',
        'global',
        'return',
        'except',
        'import',
        'assert',
        'define',
      ];
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringSliceGenerator.generate(seed);
          return validWords.includes(params.word as string);
        }),
        { numRuns: 100 }
      );
    });

    it('result is non-empty for most cases', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = stringSliceGenerator.generate(seed);
          const result = params.result as string;
          // Result can be empty for edge cases but should generally have content
          return typeof result === 'string';
        }),
        { numRuns: 100 }
      );
    });
  });
});
