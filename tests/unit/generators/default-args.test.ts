// tests/unit/generators/default-args.test.ts
import { describe, it, expect } from 'vitest';
import { defaultArgsGenerator } from '@/lib/generators/definitions/default-args';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('default-args generator', () => {
  it('has correct name', () => {
    expect(defaultArgsGenerator.name).toBe('default-args');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = defaultArgsGenerator.generate(seed);

    expect(params).toHaveProperty('funcName');
    expect(params).toHaveProperty('params');
    expect(params).toHaveProperty('callArgs');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = defaultArgsGenerator.generate(seed);
    const params2 = defaultArgsGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = defaultArgsGenerator.generate(seed);

    expect(defaultArgsGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'single_default',
      'mixed_params',
      'override_default',
      'keyword_arg',
      'multiple_defaults',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = defaultArgsGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('code contains function definition', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = defaultArgsGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('def ');
    expect(code).toContain('print(');
  });

  it('params contains default value syntax', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = defaultArgsGenerator.generate(seed);
    const paramStr = params.params as string;

    // Should have = for default value
    expect(paramStr).toContain('=');
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = defaultArgsGenerator.generate(seed);
          return defaultArgsGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('code always contains def keyword', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = defaultArgsGenerator.generate(seed);
          const code = params.code as string;
          return code.includes('def ');
        }),
        { numRuns: 100 }
      );
    });
  });
});
