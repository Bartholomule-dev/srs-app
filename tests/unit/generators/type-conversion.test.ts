import { describe, it, expect } from 'vitest';
import { typeConversionGenerator } from '@/lib/generators/definitions/type-conversion';

describe('typeConversionGenerator', () => {
  it('generates valid conversion scenarios', () => {
    const params = typeConversionGenerator.generate('test-seed');

    expect(params).toHaveProperty('inputValue');
    expect(params).toHaveProperty('targetType');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('conversionCall');
    expect(['int', 'float', 'str', 'bool']).toContain(params.targetType);
  });

  it('generates consistent results for same seed', () => {
    const params1 = typeConversionGenerator.generate('seed-abc');
    const params2 = typeConversionGenerator.generate('seed-abc');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const params = typeConversionGenerator.generate('valid');
    expect(typeConversionGenerator.validate(params)).toBe(true);
  });
});
