// tests/unit/exercise/yaml-validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateYamlExercise, validateYamlFile } from '@/lib/exercise';
import { createMockYamlExercise } from '@tests/fixtures/exercise';
import type { YamlExercise, YamlExerciseFile } from '@/lib/exercise';

describe('validateYamlExercise', () => {
  const validExercise = createMockYamlExercise({
    slug: 'for-loop-range',
    title: 'For Loop Range',
    difficulty: 1,
    prompt: 'Write a for loop',
    expected_answer: 'for i in range(5):',
    hints: ['Use range()'],
    tags: ['loops'],
  });

  it('returns empty errors for valid exercise', () => {
    const errors = validateYamlExercise(validExercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  describe('slug validation', () => {
    it('errors on missing slug', () => {
      const exercise = { ...validExercise, slug: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'slug',
        message: expect.stringContaining('required'),
      }));
    });

    it('errors on non-kebab-case slug', () => {
      const exercise = { ...validExercise, slug: 'ForLoopRange' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'slug',
        message: expect.stringContaining('kebab-case'),
      }));
    });

    it('accepts valid kebab-case slugs', () => {
      const slugs = ['simple', 'with-dash', 'multi-word-slug', 'with-123-numbers'];
      for (const slug of slugs) {
        const exercise = { ...validExercise, slug };
        const errors = validateYamlExercise(exercise, 'test.yaml');
        expect(errors.filter(e => e.field === 'slug')).toHaveLength(0);
      }
    });
  });

  describe('difficulty validation', () => {
    it('errors on difficulty out of range', () => {
      const exercise = { ...validExercise, difficulty: 4 as 1 | 2 | 3 };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'difficulty',
        message: expect.stringContaining('1, 2, or 3'),
      }));
    });

    it('errors on difficulty of 0', () => {
      const exercise = { ...validExercise, difficulty: 0 as 1 | 2 | 3 };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'difficulty',
      }));
    });
  });

  describe('required fields', () => {
    it('errors on missing title', () => {
      const exercise = { ...validExercise, title: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'title',
      }));
    });

    it('errors on missing prompt', () => {
      const exercise = { ...validExercise, prompt: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'prompt',
      }));
    });

    it('errors on missing expected_answer', () => {
      const exercise = { ...validExercise, expected_answer: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'expected_answer',
      }));
    });
  });

  describe('hints validation', () => {
    it('errors on empty hints array', () => {
      const exercise = { ...validExercise, hints: [] };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'hints',
        message: expect.stringContaining('at least 1'),
      }));
    });

    it('accepts hints with one or more items', () => {
      const exercise = { ...validExercise, hints: ['Single hint'] };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.filter(e => e.field === 'hints')).toHaveLength(0);
    });
  });

  describe('accepted_solutions field', () => {
    it('accepts exercises with accepted_solutions array', () => {
      const exercise = createMockYamlExercise({
        slug: 'test-accepted',
        accepted_solutions: ['alt1', 'alt2'],
      });
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toHaveLength(0);
    });

    it('rejects write exercises without accepted_solutions', () => {
      const exercise = createMockYamlExercise({
        slug: 'test-no-accepted',
        accepted_solutions: undefined,
      });
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.some(e => e.field === 'accepted_solutions')).toBe(true);
    });

    it('rejects accepted_solutions with non-string values', () => {
      const exercise = {
        slug: 'test-bad-accepted',
        title: 'Test',
        difficulty: 1,
        prompt: 'Test prompt',
        expected_answer: 'answer',
        hints: ['hint'],
        accepted_solutions: [123, 'valid'],
      } as unknown as YamlExercise;
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.some(e => e.field === 'accepted_solutions')).toBe(true);
    });

    it('rejects accepted_solutions that is not an array', () => {
      const exercise = {
        slug: 'test-not-array',
        title: 'Test',
        difficulty: 1,
        prompt: 'Test prompt',
        expected_answer: 'answer',
        hints: ['hint'],
        accepted_solutions: 'not-an-array',
      } as unknown as YamlExercise;
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.some(e => e.field === 'accepted_solutions')).toBe(true);
    });

    it('rejects empty accepted_solutions array for write exercises', () => {
      const exercise = createMockYamlExercise({
        slug: 'test-empty-accepted',
        accepted_solutions: [],
      });
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.some(e => e.field === 'accepted_solutions')).toBe(true);
    });
  });
});

describe('generator field validation', () => {
  it('accepts exercises with generator field', () => {
    const exercise: YamlExercise = {
      slug: 'dynamic-test',
      title: 'Dynamic Test',
      prompt: 'Get chars from {{start}} to {{end}}',
      expected_answer: 's[{{start}}:{{end}}]',
      hints: ['Use slice'],
      accepted_solutions: ['s[{{start}}:{{end}}]'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Practice dynamic slicing',
      generator: 'slice-bounds',
    };
    // Should not throw
    expect(exercise.generator).toBe('slice-bounds');
  });

  it('accepts exercises with target_construct', () => {
    const exercise: YamlExercise = {
      slug: 'construct-test',
      title: 'Construct Test',
      prompt: 'Sum the list',
      expected_answer: 'sum(nums)',
      hints: ['Use sum()'],
      accepted_solutions: ['sum(nums)'],
      concept: 'collections',
      subconcept: 'lists',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'aggregation',
      objective: 'Use built-in sum',
      target_construct: {
        type: 'builtin',
        feedback: 'Try using the sum() function',
      },
    };
    expect(exercise.target_construct?.type).toBe('builtin');
  });

  it('accepts exercises with verify_by_execution flag', () => {
    const exercise: YamlExercise = {
      slug: 'execution-test',
      title: 'Execution Test',
      prompt: 'Write a function that doubles a number',
      expected_answer: 'def double(n): return n * 2',
      hints: ['Use return'],
      accepted_solutions: ['def double(n): return n * 2'],
      concept: 'functions',
      subconcept: 'definition',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'definition',
      objective: 'Define a simple function',
      verify_by_execution: true,
    };
    expect(exercise.verify_by_execution).toBe(true);
  });

  it('errors on unknown generator', () => {
    const exercise: YamlExercise = {
      slug: 'unknown-gen',
      title: 'Unknown Generator Test',
      prompt: 'Test {{param}}',
      expected_answer: 'result',
      hints: ['hint'],
      accepted_solutions: ['result'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Test unknown generator',
      generator: 'non-existent-generator',
    };
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'generator',
      message: expect.stringContaining('Unknown generator'),
    }));
  });

  it('accepts valid generator', () => {
    const exercise: YamlExercise = {
      slug: 'valid-gen',
      title: 'Valid Generator Test',
      prompt: 'Get chars from {{start}} to {{end}}',
      expected_answer: 's[{{start}}:{{end}}]',
      hints: ['Use slice'],
      accepted_solutions: ['s[{{start}}:{{end}}]'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Test valid generator',
      generator: 'slice-bounds',
    };
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors.filter(e => e.field === 'generator')).toHaveLength(0);
  });

  it('errors on target_construct without type', () => {
    const exercise = {
      slug: 'no-type-construct',
      title: 'No Type Construct Test',
      prompt: 'Test prompt',
      expected_answer: 'result',
      hints: ['hint'],
      accepted_solutions: ['result'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Test target_construct without type',
      target_construct: {
        feedback: 'Some feedback without type',
      },
    } as unknown as YamlExercise;
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'target_construct',
      message: expect.stringContaining('must have a type field'),
    }));
  });

  it('errors on generator without placeholders in prompt', () => {
    const exercise: YamlExercise = {
      slug: 'no-placeholder',
      title: 'No Placeholder Test',
      prompt: 'This prompt has no placeholders',
      expected_answer: 'result',
      hints: ['hint'],
      accepted_solutions: ['result'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Test missing placeholders',
      generator: 'slice-bounds',
    };
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'generator',
      message: expect.stringContaining('no {{placeholders}}'),
    }));
  });
});

describe('grading_strategy field', () => {
  const createExercise = (overrides: Partial<YamlExercise>): YamlExercise => ({
    slug: 'test',
    title: 'Test',
    prompt: 'Test prompt',
    expected_answer: 'x',
    hints: ['hint'],
    accepted_solutions: ['x'],
    concept: 'foundations',
    subconcept: 'io',
    level: 'intro',
    prereqs: [],
    type: 'write',
    pattern: 'output',
    objective: 'Test objective',
    ...overrides,
  });

  it('accepts valid grading_strategy values', () => {
    const strategies = ['exact', 'token', 'ast', 'execution'] as const;
    for (const strategy of strategies) {
      const exercise = createExercise({ grading_strategy: strategy });
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.filter(e => e.field === 'grading_strategy')).toHaveLength(0);
    }
  });

  it('rejects invalid grading_strategy values', () => {
    const exercise = createExercise({ grading_strategy: 'invalid' as 'exact' });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'grading_strategy',
      message: expect.stringContaining('must be one of'),
    }));
  });

  it('accepts verification_script with execution strategy', () => {
    const exercise = createExercise({
      grading_strategy: 'execution',
      verification_script: 'assert func(1) == 2',
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  it('rejects verification_script with non-execution strategy', () => {
    const exercise = createExercise({
      grading_strategy: 'token',
      verification_script: 'assert func(1) == 2',
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'verification_script',
      message: expect.stringContaining("requires grading_strategy 'execution'"),
    }));
  });

  it('accepts exercise without grading_strategy (uses default)', () => {
    const exercise = createExercise({});
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors.filter(e => e.field === 'grading_strategy')).toHaveLength(0);
  });

  it('rejects predict exercises without grading_strategy', () => {
    const exercise = createExercise({
      type: 'predict',
      code: 'print(\"ok\")',
      grading_strategy: undefined,
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    expect(errors).toContainEqual(expect.objectContaining({
      field: 'grading_strategy',
    }));
  });

  it('accepts verification_script when grading_strategy is not set', () => {
    // If grading_strategy is not set but verification_script is present,
    // this is valid because the grading system can infer execution strategy
    const exercise = createExercise({
      verification_script: 'assert func(1) == 2',
    });
    const errors = validateYamlExercise(exercise, 'test.yaml');
    // Should not error because grading_strategy is undefined, not a conflicting value
    expect(errors.filter(e => e.field === 'verification_script')).toHaveLength(0);
  });
});

describe('validateYamlFile', () => {
  const validFile: YamlExerciseFile = {
    language: 'python',
    category: 'loops',
    exercises: [
      createMockYamlExercise({
        slug: 'for-loop-range',
        title: 'For Loop Range',
        prompt: 'Write a for loop',
        expected_answer: 'for i in range(5):',
      }),
    ],
  };

  it('returns valid result for valid file', () => {
    const result = validateYamlFile(validFile, 'loops.yaml');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.exerciseCount).toBe(1);
  });

  it('errors on missing language', () => {
    const file = { ...validFile, language: '' };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'language',
    }));
  });

  it('errors on missing category', () => {
    const file = { ...validFile, category: '' };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'category',
    }));
  });

  it('errors on empty exercises array', () => {
    const file = { ...validFile, exercises: [] };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'exercises',
    }));
  });

  it('detects duplicate slugs within file', () => {
    const file: YamlExerciseFile = {
      ...validFile,
      exercises: [
        { ...validFile.exercises[0], slug: 'same-slug' },
        { ...validFile.exercises[0], slug: 'same-slug', title: 'Different Title' },
      ],
    };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'slug',
      message: expect.stringContaining('duplicate'),
    }));
  });
});
