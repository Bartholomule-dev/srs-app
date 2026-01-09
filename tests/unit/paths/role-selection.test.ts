// tests/unit/paths/role-selection.test.ts
// Tests for role-based exercise selection for blueprint beats

import { describe, it, expect } from 'vitest';
import type { ExercisePattern } from '@/lib/curriculum/types';
import {
  selectExerciseForBeat,
  filterExercisesByRoles,
  rankExercisesByRoleMatch,
  type BeatWithRoles,
  type ExerciseCandidate,
} from '@/lib/paths/role-selection';

// Test helpers
function makeExercise(slug: string, pattern?: ExercisePattern): ExerciseCandidate {
  return { slug, pattern };
}

function makeBeat(beat: number, title: string, acceptedRoles?: string[]): BeatWithRoles {
  return { beat, title, acceptedRoles };
}

describe('Role-based Exercise Selection', () => {
  describe('filterExercisesByRoles', () => {
    it('returns all exercises when beat has no acceptedRoles', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'),
        makeExercise('list-append-item', 'mutation'),
        makeExercise('for-loop-list', 'iteration'),
      ];
      const beat = makeBeat(1, 'Create storage');

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(3);
    });

    it('returns all exercises when acceptedRoles is empty array', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'),
        makeExercise('list-append-item', 'mutation'),
      ];
      const beat = makeBeat(1, 'Create storage', []);

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(2);
    });

    it('filters to exercises matching accepted roles', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'), // create
        makeExercise('list-append-item', 'mutation'), // update
        makeExercise('for-loop-list', 'iteration'), // display
      ];
      const beat = makeBeat(1, 'Initialize storage', ['create']);

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('list-create-empty');
    });

    it('accepts exercises matching any of multiple roles', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'), // create
        makeExercise('list-append-item', 'mutation'), // update
        makeExercise('for-loop-list', 'iteration'), // display
      ];
      const beat = makeBeat(1, 'Modify data', ['create', 'update']);

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((e) => e.slug)).toContain('list-create-empty');
      expect(filtered.map((e) => e.slug)).toContain('list-append-item');
    });

    it('returns empty array when no exercises match accepted roles', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'), // create
      ];
      const beat = makeBeat(1, 'Handle errors', ['recover']);

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(0);
    });

    it('handles exercises with only slug-based role inference', () => {
      const exercises = [
        makeExercise('list-append-item'), // no pattern, but slug suggests 'update'
        makeExercise('try-except-basic'), // no pattern, but slug suggests 'recover'
      ];
      const beat = makeBeat(1, 'Handle errors', ['recover']);

      const filtered = filterExercisesByRoles(exercises, beat);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('try-except-basic');
    });
  });

  describe('rankExercisesByRoleMatch', () => {
    it('ranks exercises by role match score (descending)', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'), // create - 100 match
        makeExercise('list-append-item', 'mutation'), // update - 75 related
        makeExercise('for-loop-list', 'iteration'), // display - 25 unrelated
      ];
      const beat = makeBeat(1, 'Create storage', ['create']);

      const ranked = rankExercisesByRoleMatch(exercises, beat);

      expect(ranked[0].slug).toBe('list-create-empty');
      expect(ranked[1].slug).toBe('list-append-item'); // related to create
      expect(ranked[2].slug).toBe('for-loop-list');
    });

    it('maintains relative order for equal scores', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'),
        makeExercise('dict-create-empty', 'construction'),
        makeExercise('set-create-empty', 'construction'),
      ];
      const beat = makeBeat(1, 'Create storage', ['create']);

      const ranked = rankExercisesByRoleMatch(exercises, beat);

      // All have same role, should maintain original order
      expect(ranked[0].slug).toBe('list-create-empty');
      expect(ranked[1].slug).toBe('dict-create-empty');
      expect(ranked[2].slug).toBe('set-create-empty');
    });

    it('returns unchanged array when beat has no accepted roles', () => {
      const exercises = [
        makeExercise('for-loop-list', 'iteration'),
        makeExercise('list-create-empty', 'construction'),
      ];
      const beat = makeBeat(1, 'Any beat');

      const ranked = rankExercisesByRoleMatch(exercises, beat);

      // Should use beat title for scoring instead
      // 'create' in slug matches 'Any beat'? No, but title parsing happens
      expect(ranked).toHaveLength(2);
    });
  });

  describe('selectExerciseForBeat', () => {
    it('returns best matching exercise for beat', () => {
      const exercises = [
        makeExercise('for-loop-list', 'iteration'),
        makeExercise('list-create-empty', 'construction'),
        makeExercise('try-except-basic', 'handling'),
      ];
      const beat = makeBeat(1, 'Create storage', ['create']);

      const selected = selectExerciseForBeat(exercises, beat);

      expect(selected?.slug).toBe('list-create-empty');
    });

    it('returns null when no exercises provided', () => {
      const beat = makeBeat(1, 'Create storage', ['create']);

      const selected = selectExerciseForBeat([], beat);

      expect(selected).toBeNull();
    });

    it('returns null when no exercises match accepted roles', () => {
      const exercises = [
        makeExercise('for-loop-list', 'iteration'),
        makeExercise('list-append-item', 'mutation'),
      ];
      const beat = makeBeat(1, 'Handle errors', ['recover']);

      const selected = selectExerciseForBeat(exercises, beat);

      expect(selected).toBeNull();
    });

    it('returns first best match when multiple have same score', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'),
        makeExercise('dict-create-empty', 'construction'),
      ];
      const beat = makeBeat(1, 'Create storage', ['create']);

      const selected = selectExerciseForBeat(exercises, beat);

      // Should return first one
      expect(selected?.slug).toBe('list-create-empty');
    });

    it('returns best from title-based matching when no accepted roles', () => {
      const exercises = [
        makeExercise('for-loop-list', 'iteration'),
        makeExercise('list-create-empty', 'construction'),
      ];
      // No acceptedRoles - uses title keywords
      const beat = makeBeat(1, 'Initialize new storage');

      const selected = selectExerciseForBeat(exercises, beat);

      // 'new' and 'initialize' suggest 'create' role
      expect(selected?.slug).toBe('list-create-empty');
    });

    it('uses related roles for partial matches', () => {
      const exercises = [
        makeExercise('list-append-item', 'mutation'), // update - related to create
        makeExercise('for-loop-list', 'iteration'), // display - not related
      ];
      const beat = makeBeat(1, 'Set up data', ['create']);

      // No perfect 'create' match, but 'update' is related
      const selected = selectExerciseForBeat(exercises, beat);

      expect(selected?.slug).toBe('list-append-item');
    });
  });

  describe('integration with beat titles', () => {
    it('uses beat title keywords for role inference', () => {
      const exercises = [
        makeExercise('list-create-empty', 'construction'),
        makeExercise('try-except-basic', 'handling'),
        makeExercise('file-write-basic', 'file'),
      ];

      // Test various title keywords
      const savebeat = makeBeat(1, 'Save data to file');
      expect(selectExerciseForBeat(exercises, savebeat)?.slug).toBe('file-write-basic');

      const errorBeat = makeBeat(1, 'Handle errors gracefully');
      expect(selectExerciseForBeat(exercises, errorBeat)?.slug).toBe('try-except-basic');

      const createBeat = makeBeat(1, 'Create new collection');
      expect(selectExerciseForBeat(exercises, createBeat)?.slug).toBe('list-create-empty');
    });
  });
});
