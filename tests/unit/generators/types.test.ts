// tests/unit/generators/types.test.ts
import { describe, it, expect } from 'vitest';
import type { Generator, GeneratorParams, TargetConstruct } from '@/lib/generators/types';

describe('Generator types', () => {
  it('GeneratorParams accepts string, number, boolean, and array values', () => {
    const params: GeneratorParams = {
      start: 1,
      end: 5,
      name: 'test',
      isValid: true,
      items: [1, 2, 3],
    };
    expect(params.start).toBe(1);
    expect(params.name).toBe('test');
    expect(params.isValid).toBe(true);
    expect(params.items).toEqual([1, 2, 3]);
  });

  it('Generator interface has required properties', () => {
    const mockGenerator: Generator = {
      name: 'test-generator',
      generate: (seed: string) => ({ value: seed.length }),
      validate: (params: GeneratorParams) => typeof params.value === 'number',
    };

    expect(mockGenerator.name).toBe('test-generator');
    expect(typeof mockGenerator.generate).toBe('function');
    expect(typeof mockGenerator.validate).toBe('function');
  });

  it('TargetConstruct has type and optional feedback', () => {
    const construct: TargetConstruct = {
      type: 'slice',
      feedback: 'Try using slice notation',
    };
    expect(construct.type).toBe('slice');
    expect(construct.feedback).toBe('Try using slice notation');

    const minimalConstruct: TargetConstruct = {
      type: 'comprehension',
    };
    expect(minimalConstruct.type).toBe('comprehension');
    expect(minimalConstruct.feedback).toBeUndefined();
  });
});
