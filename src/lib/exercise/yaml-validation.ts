// src/lib/exercise/yaml-validation.ts
import type {
  YamlExercise,
  YamlExerciseFile,
  YamlValidationError,
  YamlValidationResult
} from './yaml-types';
import { hasGenerator } from '@/lib/generators';
import curriculumData from '@/lib/curriculum/python.json';
import { TAG_ALIASES, TAG_REGISTRY } from './tag-registry';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const curriculum = curriculumData as {
  concepts: Array<{ slug: string; subconcepts: string[] }>;
};
const conceptSlugs = new Set(curriculum.concepts.map(concept => concept.slug));
const subconceptSlugs = new Set(curriculum.concepts.flatMap(concept => concept.subconcepts));
const conceptSubconcepts = new Map(
  curriculum.concepts.map(concept => [concept.slug, new Set(concept.subconcepts)])
);

const PREREQ_ALIASES: Record<string, string> = {
  'control-flow.for': 'for',
  'control-flow.while': 'while',
  'control-flow.zip': 'zip',
  'control-flow.sorted': 'sorted',
  'control-flow.reversed': 'reversed',
  'control-flow.any-all': 'any-all',
  'control-flow.conditionals': 'if-else',
  'functions.define': 'fn-basics',
};

function normalizeLegacyPrereq(prereq: string): string | null {
  if (PREREQ_ALIASES[prereq]) {
    return PREREQ_ALIASES[prereq];
  }

  const dotIndex = prereq.indexOf('.');
  if (dotIndex !== -1) {
    const prefix = prereq.slice(0, dotIndex);
    const remainder = prereq.slice(dotIndex + 1);
    if (conceptSlugs.has(prefix) && subconceptSlugs.has(remainder)) {
      return remainder;
    }
  }

  return null;
}

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
  if (exercise.difficulty !== undefined && ![1, 2, 3].includes(exercise.difficulty)) {
    errors.push({
      file,
      slug,
      field: 'difficulty',
      message: 'difficulty must be 1, 2, or 3'
    });
  }

  // Subconcept must belong to its concept
  const allowedSubconcepts = conceptSubconcepts.get(exercise.concept);
  if (!allowedSubconcepts || !allowedSubconcepts.has(exercise.subconcept)) {
    errors.push({
      file,
      slug,
      field: 'subconcept',
      message: `subconcept "${exercise.subconcept}" is not valid for concept "${exercise.concept}"`,
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

  // Tags validation (canonical registry + aliases)
  if (exercise.tags) {
    for (const tag of exercise.tags) {
      if (TAG_ALIASES[tag]) {
        errors.push({
          file,
          slug,
          field: 'tags',
          message: `tag "${tag}" is legacy; use "${TAG_ALIASES[tag]}"`,
        });
        continue;
      }
      if (!TAG_REGISTRY.has(tag)) {
        errors.push({
          file,
          slug,
          field: 'tags',
          message: `unknown tag "${tag}"`,
        });
      }
    }
  }

  // Prereq validation (canonical subconcepts or concepts only)
  if (exercise.prereqs) {
    for (const prereq of exercise.prereqs) {
      const normalized = normalizeLegacyPrereq(prereq);
      if (normalized) {
        errors.push({
          file,
          slug,
          field: 'prereqs',
          message: `prereq "${prereq}" is legacy; use "${normalized}"`,
        });
        continue;
      }

      if (!conceptSlugs.has(prereq) && !subconceptSlugs.has(prereq)) {
        errors.push({
          file,
          slug,
          field: 'prereqs',
          message: `unknown prereq "${prereq}"`,
        });
      }
    }
  }

  // Targets validation (canonical subconcepts or concepts only)
  if (exercise.targets) {
    for (const target of exercise.targets) {
      const normalized = normalizeLegacyPrereq(target);
      if (normalized) {
        errors.push({
          file,
          slug,
          field: 'targets',
          message: `target "${target}" is legacy; use "${normalized}"`,
        });
        continue;
      }

      if (!conceptSlugs.has(target) && !subconceptSlugs.has(target)) {
        errors.push({
          file,
          slug,
          field: 'targets',
          message: `unknown target "${target}"`,
        });
      }
    }
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

  // Require accepted_solutions for write exercises
  if (exercise.type === 'write') {
    if (!exercise.accepted_solutions || exercise.accepted_solutions.length === 0) {
      errors.push({
        file,
        slug,
        field: 'accepted_solutions',
        message: 'write exercises must include accepted_solutions',
      });
    }
  }

  // Type-specific field validation
  if (exercise.type === 'predict' && !exercise.code) {
    errors.push({
      file,
      slug,
      field: 'code',
      message: "predict type requires 'code' field",
    });
  }

  if (exercise.type === 'predict' && !exercise.grading_strategy) {
    errors.push({
      file,
      slug,
      field: 'grading_strategy',
      message: 'predict exercises must include grading_strategy',
    });
  }

  if (exercise.type === 'fill-in') {
    if (!exercise.template) {
      errors.push({
        file,
        slug,
        field: 'template',
        message: "fill-in type requires 'template' field",
      });
    }
    if (exercise.blank_position === undefined) {
      errors.push({
        file,
        slug,
        field: 'blank_position',
        message: "fill-in type requires 'blank_position' field",
      });
    }
  }

  // Validate generator reference if present
  if (exercise.generator) {
    if (!hasGenerator(exercise.generator)) {
      errors.push({
        file,
        slug,
        field: 'generator',
        message: `Unknown generator: ${exercise.generator}`,
      });
    }
  }

  // Validate target_construct structure
  if (exercise.target_construct) {
    if (!exercise.target_construct.type) {
      errors.push({
        file,
        slug,
        field: 'target_construct',
        message: 'target_construct must have a type field',
      });
    }
  }

  // Validate template placeholders if generator present
  // Placeholders can be in prompt, code, expected_answer, or hints
  if (exercise.generator) {
    const fieldsToCheck = [
      exercise.prompt,
      exercise.code,
      exercise.expected_answer,
      ...(exercise.hints || []),
    ].filter(Boolean);

    const allText = fieldsToCheck.join(' ');
    const placeholders = allText.match(/\{\{(\w+)\}\}/g);

    if (!placeholders || placeholders.length === 0) {
      errors.push({
        file,
        slug,
        field: 'generator',
        message: 'Exercise has generator but no {{placeholders}} in prompt, code, expected_answer, or hints',
      });
    }
  }

  // Validate grading_strategy field
  const validStrategies = ['exact', 'token', 'ast', 'execution'];
  if (exercise.grading_strategy !== undefined && !validStrategies.includes(exercise.grading_strategy)) {
    errors.push({
      file,
      slug,
      field: 'grading_strategy',
      message: `grading_strategy must be one of: ${validStrategies.join(', ')}`,
    });
  }

  // Validate verification_script requires execution strategy
  if (exercise.verification_script && exercise.grading_strategy && exercise.grading_strategy !== 'execution') {
    errors.push({
      file,
      slug,
      field: 'verification_script',
      message: "verification_script requires grading_strategy 'execution'",
    });
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
