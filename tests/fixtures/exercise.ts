import type { Exercise } from '@/lib/types';
import type { YamlExercise } from '@/lib/exercise/yaml-types';

/**
 * Create a mock Exercise with all required fields including taxonomy
 */
export function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-id',
    slug: 'test-exercise',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Test Exercise',
    prompt: 'Test prompt',
    expectedAnswer: 'test answer',
    acceptedSolutions: [],
    hints: ['Hint 1'],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Taxonomy fields (Phase 2)
    concept: 'foundations',
    subconcept: 'variables',
    level: 'intro',
    prereqs: [],
    exerciseType: 'write',
    pattern: 'construction',
    template: null,
    blankPosition: null,
    // Phase 2.5 fields
    objective: '',
    targets: null,
    ...overrides,
  };
}

/**
 * Create a mock YamlExercise with all required fields including taxonomy
 */
export function createMockYamlExercise(overrides: Partial<YamlExercise> = {}): YamlExercise {
  const baseExercise: YamlExercise = {
    slug: 'test-exercise',
    title: 'Test Exercise',
    difficulty: 1,
    prompt: 'Test prompt',
    expected_answer: 'test answer',
    hints: ['Hint 1'],
    accepted_solutions: ['test answer'],
    // Taxonomy fields (Phase 2)
    concept: 'foundations',
    subconcept: 'variables',
    level: 'intro',
    prereqs: [],
    type: 'write',
    pattern: 'construction',
    // Phase 2.5 fields
    objective: 'Test objective',
  };
  return {
    ...baseExercise,
    ...overrides,
  };
}
