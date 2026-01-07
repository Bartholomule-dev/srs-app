// tests/unit/generators/render.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderExercise, type RenderableExercise } from '@/lib/generators/render';
import { registerGenerator, type Generator } from '@/lib/generators';

// Mock generator for testing
const mockGenerator: Generator = {
  name: 'test-render-gen',
  generate: () => ({ start: 2, end: 6, name: 'test' }),
  validate: () => true,
};

beforeEach(() => {
  // Register mock generator
  registerGenerator(mockGenerator);
});

describe('renderExercise', () => {
  const baseExercise: RenderableExercise = {
    slug: 'test-exercise',
    prompt: 'Static prompt',
    expectedAnswer: 'static answer',
    acceptedSolutions: [],
  };

  it('passes through static exercises unchanged', () => {
    const result = renderExercise(baseExercise, 'user-1', new Date());
    expect(result.prompt).toBe('Static prompt');
    expect(result.expectedAnswer).toBe('static answer');
    expect(result._generatedParams).toBeUndefined();
    expect(result._seed).toBeUndefined();
  });

  it('renders templates with generated params', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Get chars from {{start}} to {{end}}',
      expectedAnswer: 's[{{start}}:{{end}}]',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.prompt).toBe('Get chars from 2 to 6');
    expect(result.expectedAnswer).toBe('s[2:6]');
    expect(result._generatedParams).toEqual({ start: 2, end: 6, name: 'test' });
    expect(result._seed).toBeDefined();
  });

  it('renders acceptedSolutions templates', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Test',
      expectedAnswer: 's[{{start}}:{{end}}]',
      acceptedSolutions: ['s[{{start}}:{{end}}]', '{{name}}[{{start}}:{{end}}]'],
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.acceptedSolutions).toEqual(['s[2:6]', 'test[2:6]']);
  });

  it('renders code template for predict exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      code: 'print(s[{{start}}:{{end}}])',
      expectedAnswer: '{{name}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.code).toBe('print(s[2:6])');
    expect(result.expectedAnswer).toBe('test');
  });

  it('renders template for fill-in exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      template: 'result = s[___:{{end}}]',
      expectedAnswer: '{{start}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.template).toBe('result = s[___:6]');
    expect(result.expectedAnswer).toBe('2');
  });

  it('warns and passes through for unknown generator', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'non-existent',
      prompt: 'Template {{value}}',
      expectedAnswer: '{{value}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date());

    expect(result.prompt).toBe('Template {{value}}');
    expect(result._generatedParams).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent'));

    warnSpy.mockRestore();
  });

  it('produces same output for same (user, exercise, date)', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Index {{start}}',
      expectedAnswer: '{{start}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-123', date);
    const result2 = renderExercise(exercise, 'user-123', date);

    expect(result1.prompt).toBe(result2.prompt);
    expect(result1._seed).toBe(result2._seed);
  });

  it('produces different output for different users', () => {
    // Need a generator that actually varies
    const varyingGenerator: Generator = {
      name: 'varying-gen',
      generate: (seed) => {
        // Use seed to produce different values
        const num = seed.charCodeAt(0) % 10;
        return { value: num };
      },
      validate: () => true,
    };
    registerGenerator(varyingGenerator);

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'varying-gen',
      prompt: 'Value: {{value}}',
      expectedAnswer: '{{value}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-aaa', date);
    const result2 = renderExercise(exercise, 'user-zzz', date);

    // Seeds should differ
    expect(result1._seed).not.toBe(result2._seed);
  });
});
