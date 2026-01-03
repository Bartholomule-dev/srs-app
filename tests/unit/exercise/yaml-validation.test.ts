// tests/unit/exercise/yaml-validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateYamlExercise, validateYamlFile } from '@/lib/exercise';
import type { YamlExercise, YamlExerciseFile } from '@/lib/exercise';

describe('validateYamlExercise', () => {
  const validExercise: YamlExercise = {
    slug: 'for-loop-range',
    title: 'For Loop Range',
    difficulty: 1,
    prompt: 'Write a for loop',
    expected_answer: 'for i in range(5):',
    hints: ['Use range()'],
    tags: ['loops'],
  };

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
});

describe('validateYamlFile', () => {
  const validFile: YamlExerciseFile = {
    language: 'python',
    category: 'loops',
    exercises: [
      {
        slug: 'for-loop-range',
        title: 'For Loop Range',
        difficulty: 1,
        prompt: 'Write a for loop',
        expected_answer: 'for i in range(5):',
        hints: ['Use range()'],
      },
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
