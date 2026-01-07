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
  const teaching = subconcept.teaching;

  // If we have exampleCode, we don't need exampleSlug
  const hasExampleCode = !!teaching.exampleCode;

  // Find example exercise (only needed if no exampleCode or for legacy)
  let exampleExercise: Exercise | null = null;
  if (teaching.exampleSlug) {
    exampleExercise = findExampleExercise(teaching.exampleSlug, exercises);
    if (!exampleExercise && !hasExampleCode) {
      console.warn(`Teaching example not found: ${teaching.exampleSlug}`);
      return null;
    }
  }

  // If no exampleCode and no valid exampleSlug, we need at least one exercise
  if (!hasExampleCode && !exampleExercise) {
    // Try to find ANY intro exercise for this subconcept
    exampleExercise = exercises.find(
      e => e.subconcept === subconceptSlug && e.level === 'intro'
    ) ?? null;

    if (!exampleExercise) {
      console.warn(`No example exercise found for subconcept: ${subconceptSlug}`);
      return null;
    }
  }

  // Find practice exercise (different from example if we have one)
  const excludeSlug = exampleExercise?.slug ?? '';
  const practiceExercise = findPracticeExercise(subconceptSlug, excludeSlug, exercises);

  if (!practiceExercise) {
    console.warn(`No practice exercise found for subconcept: ${subconceptSlug}`);
    return null;
  }

  // Build the teaching card
  const teachingCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: subconceptSlug,
    teaching: subconcept.teaching,
    exampleExercise: exampleExercise ?? practiceExercise, // Fallback for type safety
  };

  // Build the practice card
  const practiceCard: PracticeSessionCard = {
    type: 'practice',
    exercise: practiceExercise,
    isNew: true,
  };

  return { teachingCard, practiceCard };
}
