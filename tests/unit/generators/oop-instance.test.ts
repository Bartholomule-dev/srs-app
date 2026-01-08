import { describe, it, expect } from 'vitest';
import { oopInstanceGenerator } from '@/lib/generators/definitions/oop-instance';

describe('oopInstanceGenerator', () => {
  it('generates correct params', () => {
    const params = oopInstanceGenerator.generate('test-seed');

    expect(typeof params.personName).toBe('string');
    expect(params.personName).toMatch(/^[A-Z][a-z]+$/);
    expect(params.age).toBeGreaterThanOrEqual(18);
    expect(params.age).toBeLessThanOrEqual(65);
  });

  it('validates correct params', () => {
    const params = oopInstanceGenerator.generate('test-seed');
    expect(oopInstanceGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid age', () => {
    expect(oopInstanceGenerator.validate({ personName: 'Alice', age: 17 })).toBe(false);
    expect(oopInstanceGenerator.validate({ personName: 'Alice', age: 66 })).toBe(false);
  });

  it('rejects invalid personName format', () => {
    expect(oopInstanceGenerator.validate({ personName: 'alice', age: 25 })).toBe(false);
    expect(oopInstanceGenerator.validate({ personName: 'ALICE', age: 25 })).toBe(false);
    expect(oopInstanceGenerator.validate({ personName: 'alice123', age: 25 })).toBe(false);
  });

  it('produces deterministic output for same seed', () => {
    const params1 = oopInstanceGenerator.generate('test-seed');
    const params2 = oopInstanceGenerator.generate('test-seed');
    expect(params1).toEqual(params2);
  });

  it('produces different output for different seeds', () => {
    const params1 = oopInstanceGenerator.generate('seed-1');
    const params2 = oopInstanceGenerator.generate('seed-2');
    // At least one param should differ
    const same = params1.personName === params2.personName && params1.age === params2.age;
    expect(same).toBe(false);
  });
});
