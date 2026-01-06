import type { Exercise } from '@/lib/types';
import type { SubconceptDefinition } from '@/lib/curriculum/types';
import type { TeachingSessionCard, PracticeSessionCard } from './types';

export interface TeachingPair {
  teachingCard: TeachingSessionCard;
  practiceCard: PracticeSessionCard;
}

/**
 * Find the example exercise by slug
 */
export function findExampleExercise(
  exampleSlug: string,
  exercises: Exercise[]
): Exercise | null {
  return exercises.find(e => e.slug === exampleSlug) ?? null;
}

/**
 * Find a practice exercise for a subconcept (different from example)
 */
function findPracticeExercise(
  subconceptSlug: string,
  exampleSlug: string,
  exercises: Exercise[]
): Exercise | null {
  // Get all exercises for this subconcept except the example
  const candidates = exercises.filter(
    e => e.subconcept === subconceptSlug && e.slug !== exampleSlug
  );

  if (candidates.length === 0) return null;

  // Prefer intro or practice level for first attempt
  const preferred = candidates.find(
    e => e.level === 'intro' || e.level === 'practice'
  );

  return preferred ?? candidates[0];
}

/**
 * Build a teaching + practice card pair for a new subconcept
 *
 * @returns TeachingPair or null if example or practice exercise not found
 */
export function buildTeachingPair(
  subconceptSlug: string,
  subconcept: SubconceptDefinition,
  exercises: Exercise[]
): TeachingPair | null {
  // Find the example exercise
  const exampleExercise = findExampleExercise(
    subconcept.teaching.exampleSlug,
    exercises
  );

  if (!exampleExercise) {
    console.warn(`Teaching example not found: ${subconcept.teaching.exampleSlug}`);
    return null;
  }

  // Find a different exercise for practice
  const practiceExercise = findPracticeExercise(
    subconceptSlug,
    subconcept.teaching.exampleSlug,
    exercises
  );

  if (!practiceExercise) {
    console.warn(`No practice exercise found for subconcept: ${subconceptSlug}`);
    return null;
  }

  // Build the teaching card
  const teachingCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: subconceptSlug,
    teaching: subconcept.teaching,
    exampleExercise,
  };

  // Build the practice card
  const practiceCard: PracticeSessionCard = {
    type: 'practice',
    exercise: practiceExercise,
    isNew: true,
  };

  return { teachingCard, practiceCard };
}
