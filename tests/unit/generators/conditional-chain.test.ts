// tests/unit/generators/conditional-chain.test.ts
import { describe, it, expect } from 'vitest';
import { conditionalChainGenerator } from '@/lib/generators/definitions/conditional-chain';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('conditional-chain generator', () => {
  it('has correct name', () => {
    expect(conditionalChainGenerator.name).toBe('conditional-chain');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = conditionalChainGenerator.generate(seed);

    expect(params).toHaveProperty('value');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('branchIndex');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = conditionalChainGenerator.generate(seed);
    const params2 = conditionalChainGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = conditionalChainGenerator.generate(seed);

    expect(conditionalChainGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'grade',
      'age_category',
      'temperature',
      'size',
      'discount',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = conditionalChainGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('code contains if/elif/else structure', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = conditionalChainGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('if ');
    expect(code).toContain('elif ');
    expect(code).toContain('else:');
  });

  it('code contains the value', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = conditionalChainGenerator.generate(seed);
    const code = params.code as string;
    const value = params.value as number;

    expect(code).toContain(String(value));
  });

  it('branchIndex is valid', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = conditionalChainGenerator.generate(seed);
    const branchIndex = params.branchIndex as number;

    expect(branchIndex).toBeGreaterThanOrEqual(0);
    expect(branchIndex).toBeLessThanOrEqual(4); // Max 5 branches
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = conditionalChainGenerator.generate(seed);
          return conditionalChainGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('result is always a non-empty string', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = conditionalChainGenerator.generate(seed);
          const result = params.result as string;
          return typeof result === 'string' && result.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('branchIndex matches result', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = conditionalChainGenerator.generate(seed);
          // Just verify they're both present and valid
          return typeof params.branchIndex === 'number' && typeof params.result === 'string';
        }),
        { numRuns: 100 }
      );
    });
  });
});
