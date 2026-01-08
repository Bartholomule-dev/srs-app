// tests/unit/generators/exception-scenario.test.ts
import { describe, it, expect } from 'vitest';
import { exceptionScenarioGenerator } from '@/lib/generators/definitions/exception-scenario';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('exception-scenario generator', () => {
  it('has correct name', () => {
    expect(exceptionScenarioGenerator.name).toBe('exception-scenario');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = exceptionScenarioGenerator.generate(seed);

    expect(params).toHaveProperty('operation');
    expect(params).toHaveProperty('exceptionType');
    expect(params).toHaveProperty('message');
    expect(params).toHaveProperty('context');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('catchBlock');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = exceptionScenarioGenerator.generate(seed);
    const params2 = exceptionScenarioGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = exceptionScenarioGenerator.generate(seed);

    expect(exceptionScenarioGenerator.validate(params)).toBe(true);
  });

  it('produces valid exception types', () => {
    const validTypes = [
      'FileNotFoundError',
      'ZeroDivisionError',
      'IndexError',
      'KeyError',
      'ValueError',
      'AttributeError',
      'TypeError',
      'ImportError',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = exceptionScenarioGenerator.generate(seed);

    expect(validTypes).toContain(params.exceptionType);
  });

  it('catchBlock matches exceptionType', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = exceptionScenarioGenerator.generate(seed);

    expect(params.catchBlock).toBe(`except ${params.exceptionType}:`);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = exceptionScenarioGenerator.generate(seed);
          return exceptionScenarioGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
