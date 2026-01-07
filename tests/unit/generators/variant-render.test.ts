// tests/unit/generators/variant-render.test.ts
// Tests for variant support in exercise rendering

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderExercise } from '@/lib/generators/render';
import * as generatorIndex from '@/lib/generators/index';

describe('variant rendering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses variant overrides when generator returns variant param', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-variant-gen',
      generate: () => ({
        variant: 'optionB',
        value: 42,
      }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-variant',
      prompt: 'Base prompt with {{value}}',
      expectedAnswer: 'base answer',
      acceptedSolutions: [],
      generator: 'test-variant-gen',
      variants: {
        optionA: {
          prompt: 'Option A prompt with {{value}}',
          expectedAnswer: 'option A answer',
        },
        optionB: {
          prompt: 'Option B prompt with {{value}}',
          expectedAnswer: 'option B answer {{value}}',
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());

    expect(rendered.prompt).toBe('Option B prompt with 42');
    expect(rendered.expectedAnswer).toBe('option B answer 42');
  });

  it('falls back to base fields when no variant matches', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ value: 99 }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-no-variant',
      prompt: 'Base prompt {{value}}',
      expectedAnswer: 'base {{value}}',
      acceptedSolutions: [],
      generator: 'test-gen',
      variants: {
        optionA: { prompt: 'Should not use this' },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());

    expect(rendered.prompt).toBe('Base prompt 99');
    expect(rendered.expectedAnswer).toBe('base 99');
  });

  it('replaces hints when variant provides them', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'special' }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-hints',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      hints: ['base hint'],
      variants: {
        special: {
          hints: ['special hint 1', 'special hint 2'],
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.hints).toEqual(['special hint 1', 'special hint 2']);
  });

  it('renders hints through Mustache when variant provides them', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'dynamic', value: 'test-value' }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-dynamic-hints',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      hints: ['base hint'],
      variants: {
        dynamic: {
          hints: ['hint with {{value}}'],
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.hints).toEqual(['hint with test-value']);
  });

  it('renders base hints through Mustache when no variant matches', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ value: 'dynamic' }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-base-hints',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      hints: ['base hint with {{value}}'],
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.hints).toEqual(['base hint with dynamic']);
  });

  it('replaces code when variant provides it', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'codeVariant', num: 10 }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-code-variant',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      code: 'base code {{num}}',
      variants: {
        codeVariant: {
          code: 'variant code {{num}}',
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.code).toBe('variant code 10');
  });

  it('replaces template when variant provides it', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'templateVariant', blank: '___' }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-template-variant',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      template: 'base template {{blank}}',
      variants: {
        templateVariant: {
          template: 'variant template {{blank}}',
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.template).toBe('variant template ___');
  });

  it('replaces acceptedSolutions when variant provides them', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'altSolutions', val: 5 }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-accepted-variant',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: ['base {{val}}'],
      generator: 'test-gen',
      variants: {
        altSolutions: {
          acceptedSolutions: ['variant {{val}}', 'another {{val}}'],
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.acceptedSolutions).toEqual(['variant 5', 'another 5']);
  });

  it('works with exercises that have no variants field', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ value: 123 }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-no-variants',
      prompt: 'prompt {{value}}',
      expectedAnswer: 'answer {{value}}',
      acceptedSolutions: [],
      generator: 'test-gen',
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());
    expect(rendered.prompt).toBe('prompt 123');
    expect(rendered.expectedAnswer).toBe('answer 123');
  });
});
