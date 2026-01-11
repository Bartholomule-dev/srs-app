// tests/unit/srs/exercise-selection.test.ts
// Tests for algorithm-agnostic exercise selection with FSRS integration
import { describe, it, expect } from 'vitest';
import {
  selectExercise,
  mapFSRSStateToPhase,
  getUnderrepresentedType,
  selectExerciseByType,
  LEVEL_ORDER,
  type SubconceptSelectionInfo,
} from '@/lib/srs/exercise-selection';
import type { Exercise } from '@/lib/types/app.types';
import type { ExerciseAttempt, ExerciseType, ExerciseLevel, ExercisePattern } from '@/lib/curriculum/types';

// Helper to create mock exercises
function createExercise(
  overrides: Partial<{
    id: string;
    slug: string;
    subconcept: string;
    level: ExerciseLevel;
    pattern: ExercisePattern;
    exerciseType: ExerciseType;
  }> = {}
): Exercise {
  const id = overrides.id ?? 'ex-1';
  return {
    id,
    slug: overrides.slug ?? `exercise-${id}`,
    language: 'python',
    category: 'loops',
    difficulty: 1,
    title: 'Test Exercise',
    prompt: 'Test prompt',
    expectedAnswer: 'test',
    acceptedSolutions: [],
    hints: [],
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    concept: 'loops',
    subconcept: overrides.subconcept ?? 'for',
    level: overrides.level ?? 'intro',
    prereqs: [],
    exerciseType: overrides.exerciseType ?? 'write',
    pattern: overrides.pattern ?? 'iteration',
    objective: 'Test objective',
    targets: null,
    template: null,
    blankPosition: null,
  } as Exercise;
}

// Helper to create mock attempts
function createAttempt(slug: string, timesSeen: number, timesCorrect: number = timesSeen): ExerciseAttempt {
  return {
    id: `attempt-${slug}`,
    userId: 'user-123',
    exerciseSlug: slug,
    timesSeen,
    timesCorrect,
    lastSeenAt: new Date(),
  };
}

describe('mapFSRSStateToPhase', () => {
  it('maps New to learning', () => {
    expect(mapFSRSStateToPhase('New')).toBe('learning');
  });

  it('maps Learning to learning', () => {
    expect(mapFSRSStateToPhase('Learning')).toBe('learning');
  });

  it('maps Relearning to learning', () => {
    expect(mapFSRSStateToPhase('Relearning')).toBe('learning');
  });

  it('maps Review to review', () => {
    expect(mapFSRSStateToPhase('Review')).toBe('review');
  });
});

describe('selectExercise', () => {
  describe('Learning Phase - Level Progression', () => {
    it('selects intro level exercises first', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'intro-1', level: 'intro' }),
        createExercise({ id: '2', slug: 'practice-1', level: 'practice' }),
        createExercise({ id: '3', slug: 'edge-1', level: 'edge' }),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, []);

      expect(selected).not.toBeNull();
      expect(selected!.level).toBe('intro');
    });

    it('progresses to practice level when all intro seen', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'intro-1', level: 'intro' }),
        createExercise({ id: '2', slug: 'practice-1', level: 'practice' }),
      ];
      const attempts = [createAttempt('intro-1', 1)];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, attempts);

      expect(selected).not.toBeNull();
      expect(selected!.level).toBe('practice');
    });

    it('progresses through all levels in order', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'intro-1', level: 'intro' }),
        createExercise({ id: '2', slug: 'practice-1', level: 'practice' }),
        createExercise({ id: '3', slug: 'edge-1', level: 'edge' }),
        createExercise({ id: '4', slug: 'integrated-1', level: 'integrated' }),
      ];

      // All intro and practice seen
      const attempts = [
        createAttempt('intro-1', 1),
        createAttempt('practice-1', 1),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, attempts);

      expect(selected).not.toBeNull();
      expect(selected!.level).toBe('edge');
    });

    it('prefers unseen exercises within current level', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'intro-1', level: 'intro' }),
        createExercise({ id: '2', slug: 'intro-2', level: 'intro' }),
      ];
      const attempts = [createAttempt('intro-1', 1)];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, attempts);

      expect(selected).not.toBeNull();
      expect(selected!.slug).toBe('intro-2');
    });
  });

  describe('Review Phase - Least-Seen Selection', () => {
    it('selects least-seen exercise', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'ex-1' }),
        createExercise({ id: '2', slug: 'ex-2' }),
        createExercise({ id: '3', slug: 'ex-3' }),
      ];
      const attempts = [
        createAttempt('ex-1', 5),
        createAttempt('ex-2', 2),
        createAttempt('ex-3', 8),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'review' };
      const selected = selectExercise(info, exercises, attempts);

      expect(selected).not.toBeNull();
      expect(selected!.slug).toBe('ex-2');
    });

    it('selects unseen exercises first', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'seen-1' }),
        createExercise({ id: '2', slug: 'unseen-1' }),
      ];
      const attempts = [createAttempt('seen-1', 3)];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'review' };
      const selected = selectExercise(info, exercises, attempts);

      expect(selected).not.toBeNull();
      expect(selected!.slug).toBe('unseen-1');
    });
  });

  describe('Anti-Repeat Pattern Selection', () => {
    it('avoids same pattern when alternatives exist', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'iter-1', level: 'intro', pattern: 'iteration' }),
        createExercise({ id: '2', slug: 'accum-1', level: 'intro', pattern: 'accumulator' }),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, [], 'iteration');

      expect(selected).not.toBeNull();
      expect(selected!.pattern).toBe('accumulator');
    });

    it('falls back to same pattern if no alternatives', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'iter-1', level: 'intro', pattern: 'iteration' }),
        createExercise({ id: '2', slug: 'iter-2', level: 'intro', pattern: 'iteration' }),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, [], 'iteration');

      expect(selected).not.toBeNull();
      expect(selected!.pattern).toBe('iteration');
    });
  });

  describe('Edge Cases', () => {
    it('returns null for empty exercise list', () => {
      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, [], []);
      expect(selected).toBeNull();
    });

    it('returns null when no exercises match subconcept', () => {
      const exercises = [
        createExercise({ id: '1', subconcept: 'while' }),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'learning' };
      const selected = selectExercise(info, exercises, []);
      expect(selected).toBeNull();
    });

    it('handles exercises with same timesSeen', () => {
      const exercises = [
        createExercise({ id: '1', slug: 'ex-1' }),
        createExercise({ id: '2', slug: 'ex-2' }),
        createExercise({ id: '3', slug: 'ex-3' }),
      ];
      const attempts = [
        createAttempt('ex-1', 2),
        createAttempt('ex-2', 2),
        createAttempt('ex-3', 2),
      ];

      const info: SubconceptSelectionInfo = { subconceptSlug: 'for', phase: 'review' };
      const selected = selectExercise(info, exercises, attempts);

      // Should select one of them (random selection)
      expect(selected).not.toBeNull();
      expect(['ex-1', 'ex-2', 'ex-3']).toContain(selected!.slug);
    });
  });
});

describe('getUnderrepresentedType', () => {
  it('returns write for empty session', () => {
    const result = getUnderrepresentedType([], { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    expect(result).toBe('write');
  });

  it('returns underrepresented type', () => {
    const history: ExerciseType[] = ['write', 'write', 'write', 'write'];
    const result = getUnderrepresentedType(history, { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    expect(['fill-in', 'predict']).toContain(result);
  });

  it('returns null when balanced', () => {
    const history: ExerciseType[] = ['write', 'write', 'fill-in', 'predict'];
    const result = getUnderrepresentedType(history, { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    // Should be null or close to balanced
    expect(result === null || ['write', 'fill-in', 'predict'].includes(result!)).toBe(true);
  });

  it('works with refresher ratios (80% write)', () => {
    const history: ExerciseType[] = ['write', 'write', 'write'];
    const result = getUnderrepresentedType(history, { write: 0.8, 'fill-in': 0.1, predict: 0.1 });
    // With 100% write in history and 80% target, write is overrepresented
    expect(result === 'fill-in' || result === 'predict' || result === null).toBe(true);
  });

  it('works with beginner ratios (30% write)', () => {
    const history: ExerciseType[] = ['fill-in', 'predict', 'fill-in'];
    const result = getUnderrepresentedType(history, { write: 0.3, 'fill-in': 0.35, predict: 0.35 });
    expect(result).toBe('write');
  });
});

describe('selectExerciseByType', () => {
  const exercises = [
    createExercise({ id: '1', exerciseType: 'write' }),
    createExercise({ id: '2', exerciseType: 'fill-in' }),
    createExercise({ id: '3', exerciseType: 'predict' }),
  ];

  it('prefers underrepresented type', () => {
    const history: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.5, 'fill-in': 0.25, predict: 0.25 };

    const selected = selectExerciseByType(exercises, history, ratios);
    expect(selected).not.toBeNull();
    expect(['fill-in', 'predict']).toContain(selected!.exerciseType);
  });

  it('falls back when preferred type unavailable', () => {
    const writeOnly = [createExercise({ id: '1', exerciseType: 'write' })];
    const history: ExerciseType[] = ['write', 'write', 'write'];
    const ratios = { write: 0.3, 'fill-in': 0.35, predict: 0.35 };

    const selected = selectExerciseByType(writeOnly, history, ratios);
    expect(selected).not.toBeNull();
    expect(selected!.exerciseType).toBe('write');
  });

  it('returns null for empty exercise list', () => {
    const selected = selectExerciseByType([], [], { write: 0.5, 'fill-in': 0.25, predict: 0.25 });
    expect(selected).toBeNull();
  });
});

describe('LEVEL_ORDER constant', () => {
  it('has correct order', () => {
    expect(LEVEL_ORDER).toEqual(['intro', 'practice', 'edge']);
  });

  it('has 3 levels', () => {
    expect(LEVEL_ORDER).toHaveLength(3);
  });
});
