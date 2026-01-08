// tests/unit/generators/class-method.test.ts
import { describe, it, expect } from 'vitest';
import { classMethodGenerator } from '@/lib/generators/definitions/class-method';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('class-method generator', () => {
  it('has correct name', () => {
    expect(classMethodGenerator.name).toBe('class-method');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = classMethodGenerator.generate(seed);

    expect(params).toHaveProperty('className');
    expect(params).toHaveProperty('method');
    expect(params).toHaveProperty('attribute');
    expect(params).toHaveProperty('initialValue');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('context');
    expect(params).toHaveProperty('code');
    expect(params).toHaveProperty('methodCall');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = classMethodGenerator.generate(seed);
    const params2 = classMethodGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('generates different output for different seeds', () => {
    const seed1 = createSeed('user1', 'test', new Date('2026-01-08'));
    const seed2 = createSeed('user2', 'test', new Date('2026-01-08'));

    const params1 = classMethodGenerator.generate(seed1);
    const params2 = classMethodGenerator.generate(seed2);

    expect(
      params1.className !== params2.className ||
        params1.initialValue !== params2.initialValue
    ).toBe(true);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = classMethodGenerator.generate(seed);

    expect(classMethodGenerator.validate(params)).toBe(true);
  });

  it('produces valid class names', () => {
    const validClasses = [
      'Counter',
      'BankAccount',
      'Temperature',
      'Rectangle',
      'Score',
      'Timer',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = classMethodGenerator.generate(seed);

    expect(validClasses).toContain(params.className);
  });

  it('produces code containing class definition', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = classMethodGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('class');
    expect(code).toContain('def __init__');
    expect(code).toContain('self.');
  });

  it('methodCall matches the pattern', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = classMethodGenerator.generate(seed);
    const methodCall = params.methodCall as string;

    expect(methodCall).toMatch(/^obj\.\w+\(.*\)$/);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = classMethodGenerator.generate(seed);
          return classMethodGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('initialValue is always in valid range', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = classMethodGenerator.generate(seed);
          const initialValue = params.initialValue as number;
          return initialValue >= 1 && initialValue <= 20;
        }),
        { numRuns: 100 }
      );
    });
  });
});
