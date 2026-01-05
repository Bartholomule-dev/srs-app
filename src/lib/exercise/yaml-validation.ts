// src/lib/exercise/yaml-validation.ts
import type {
  YamlExercise,
  YamlExerciseFile,
  YamlValidationError,
  YamlValidationResult
} from './yaml-types';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validate a single exercise from YAML
 */
export function validateYamlExercise(
  exercise: YamlExercise,
  file: string
): YamlValidationError[] {
  const errors: YamlValidationError[] = [];
  const slug = exercise.slug || '(missing)';

  // Slug validation
  if (!exercise.slug) {
    errors.push({ file, slug, field: 'slug', message: 'slug is required' });
  } else if (!KEBAB_CASE_REGEX.test(exercise.slug)) {
    errors.push({
      file,
      slug,
      field: 'slug',
      message: 'slug must be kebab-case (lowercase letters, numbers, and hyphens)'
    });
  }

  // Required string fields
  if (!exercise.title) {
    errors.push({ file, slug, field: 'title', message: 'title is required' });
  }
  if (!exercise.prompt) {
    errors.push({ file, slug, field: 'prompt', message: 'prompt is required' });
  }
  if (!exercise.expected_answer) {
    errors.push({ file, slug, field: 'expected_answer', message: 'expected_answer is required' });
  }

  // Difficulty validation
  if (![1, 2, 3].includes(exercise.difficulty)) {
    errors.push({
      file,
      slug,
      field: 'difficulty',
      message: 'difficulty must be 1, 2, or 3'
    });
  }

  // Hints validation
  if (!exercise.hints || exercise.hints.length === 0) {
    errors.push({
      file,
      slug,
      field: 'hints',
      message: 'hints must have at least 1 item'
    });
  }

  // Validate accepted_solutions if present
  if (exercise.accepted_solutions !== undefined) {
    if (!Array.isArray(exercise.accepted_solutions)) {
      errors.push({
        file,
        slug,
        field: 'accepted_solutions',
        message: 'accepted_solutions must be an array',
      });
    } else {
      for (let i = 0; i < exercise.accepted_solutions.length; i++) {
        if (typeof exercise.accepted_solutions[i] !== 'string') {
          errors.push({
            file,
            slug,
            field: 'accepted_solutions',
            message: `accepted_solutions[${i}] must be a string`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate an entire YAML exercise file
 */
export function validateYamlFile(
  fileContent: YamlExerciseFile,
  fileName: string
): YamlValidationResult {
  const errors: YamlValidationError[] = [];

  // File-level validation
  if (!fileContent.language) {
    errors.push({ file: fileName, field: 'language', message: 'language is required' });
  }
  if (!fileContent.category) {
    errors.push({ file: fileName, field: 'category', message: 'category is required' });
  }
  if (!fileContent.exercises || fileContent.exercises.length === 0) {
    errors.push({ file: fileName, field: 'exercises', message: 'exercises array is required and must not be empty' });
  }

  // Validate each exercise
  const slugsSeen = new Set<string>();
  for (const exercise of fileContent.exercises || []) {
    const exerciseErrors = validateYamlExercise(exercise, fileName);
    errors.push(...exerciseErrors);

    // Check for duplicate slugs within file
    if (exercise.slug) {
      if (slugsSeen.has(exercise.slug)) {
        errors.push({
          file: fileName,
          slug: exercise.slug,
          field: 'slug',
          message: `duplicate slug "${exercise.slug}" in file`,
        });
      }
      slugsSeen.add(exercise.slug);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    exerciseCount: fileContent.exercises?.length || 0,
  };
}
