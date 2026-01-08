// tests/unit/generators/inheritance-method.test.ts
import { describe, it, expect } from 'vitest';
import { inheritanceMethodGenerator } from '@/lib/generators/definitions/inheritance-method';
import { createSeed } from '@/lib/generators/seed';
import fc from 'fast-check';

describe('inheritance-method generator', () => {
  it('has correct name', () => {
    expect(inheritanceMethodGenerator.name).toBe('inheritance-method');
  });

  it('generates required params', () => {
    const seed = createSeed('user1', 'test-exercise', new Date());
    const params = inheritanceMethodGenerator.generate(seed);

    expect(params).toHaveProperty('parentClass');
    expect(params).toHaveProperty('childClass');
    expect(params).toHaveProperty('method');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('description');
    expect(params).toHaveProperty('scenario');
    expect(params).toHaveProperty('callOn');
    expect(params).toHaveProperty('code');
  });

  it('generates deterministic output for same seed', () => {
    const seed = createSeed('user1', 'test-exercise', new Date('2026-01-08'));
    const params1 = inheritanceMethodGenerator.generate(seed);
    const params2 = inheritanceMethodGenerator.generate(seed);

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = inheritanceMethodGenerator.generate(seed);

    expect(inheritanceMethodGenerator.validate(params)).toBe(true);
  });

  it('produces valid scenario names', () => {
    const validScenarios = [
      'override_method',
      'inherit_method',
      'parent_direct',
      'super_extend',
      'override_returns_different',
    ];
    const seed = createSeed('user1', 'test', new Date());
    const params = inheritanceMethodGenerator.generate(seed);

    expect(validScenarios).toContain(params.scenario);
  });

  it('code contains class definitions', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = inheritanceMethodGenerator.generate(seed);
    const code = params.code as string;

    expect(code).toContain('class ');
    expect(code).toContain('def ');
    expect(code).toContain('print(');
  });

  it('code shows inheritance relationship', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = inheritanceMethodGenerator.generate(seed);
    const code = params.code as string;
    const parentClass = params.parentClass as string;
    const childClass = params.childClass as string;

    // Child class should inherit from parent
    expect(code).toContain(`class ${childClass}(${parentClass})`);
  });

  it('callOn is parent or child', () => {
    const seed = createSeed('user1', 'test', new Date());
    const params = inheritanceMethodGenerator.generate(seed);

    expect(['parent', 'child']).toContain(params.callOn);
  });

  describe('property-based tests', () => {
    it('always produces valid params for any seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = inheritanceMethodGenerator.generate(seed);
          return inheritanceMethodGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });

    it('code always contains class keyword', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (seed) => {
          const params = inheritanceMethodGenerator.generate(seed);
          const code = params.code as string;
          return code.includes('class ');
        }),
        { numRuns: 100 }
      );
    });
  });
});
