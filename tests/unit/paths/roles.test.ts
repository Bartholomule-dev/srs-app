// tests/unit/paths/roles.test.ts
import { describe, it, expect } from 'vitest';
import {
  ExerciseRole,
  ROLE_DEFINITIONS,
  roleMatchesBeat,
  inferRoleFromExercise,
} from '@/lib/paths/roles';

describe('Exercise Roles', () => {
  it('defines 8 roles', () => {
    expect(Object.keys(ROLE_DEFINITIONS)).toHaveLength(8);
  });

  it('includes all standard roles', () => {
    const roles: ExerciseRole[] = [
      'create',
      'update',
      'query',
      'transform',
      'display',
      'persist',
      'guard',
      'recover',
    ];
    roles.forEach((role) => {
      expect(ROLE_DEFINITIONS[role]).toBeDefined();
    });
  });

  describe('roleMatchesBeat', () => {
    it('matches create role to initialization beats', () => {
      expect(roleMatchesBeat('create', { beat: 1, title: 'Create storage' })).toBe(true);
    });

    it('matches display role to output beats', () => {
      expect(roleMatchesBeat('display', { beat: 5, title: 'Display items' })).toBe(true);
    });

    it('matches update role to modification beats', () => {
      expect(roleMatchesBeat('update', { beat: 2, title: 'Add items' })).toBe(true);
    });

    it('matches query role to check beats', () => {
      expect(roleMatchesBeat('query', { beat: 3, title: 'Check existence' })).toBe(true);
    });

    it('matches transform role to transform beats', () => {
      expect(roleMatchesBeat('transform', { beat: 4, title: 'Filter items' })).toBe(true);
    });

    it('matches persist role to save beats', () => {
      expect(roleMatchesBeat('persist', { beat: 6, title: 'Save data' })).toBe(true);
    });

    it('matches guard role to validation beats', () => {
      expect(roleMatchesBeat('guard', { beat: 7, title: 'Validate input' })).toBe(true);
    });

    it('matches recover role to error beats', () => {
      expect(roleMatchesBeat('recover', { beat: 8, title: 'Handle errors' })).toBe(true);
    });

    it('returns false for non-matching role and beat', () => {
      expect(roleMatchesBeat('create', { beat: 8, title: 'Handle errors' })).toBe(false);
    });
  });

  describe('inferRoleFromExercise', () => {
    it('infers create from construction patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-create-empty', pattern: 'construction' })).toBe(
        'create'
      );
    });

    it('infers update from mutation patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-append-item', pattern: 'mutation' })).toBe(
        'update'
      );
    });

    it('infers query from query patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-in-check', pattern: 'query' })).toBe('query');
    });

    it('infers display from iteration patterns', () => {
      expect(inferRoleFromExercise({ slug: 'for-loop-list', pattern: 'iteration' })).toBe('display');
    });

    it('infers transform from filtering patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-comp-filter', pattern: 'filtering' })).toBe(
        'transform'
      );
    });

    it('infers persist from context patterns', () => {
      expect(inferRoleFromExercise({ slug: 'context-intro', pattern: 'context' })).toBe('persist');
    });

    it('infers persist from file patterns', () => {
      expect(inferRoleFromExercise({ slug: 'file-write-basic', pattern: 'file' })).toBe('persist');
    });

    it('infers guard from conditional patterns', () => {
      expect(inferRoleFromExercise({ slug: 'if-else-basic', pattern: 'conditional' })).toBe('guard');
    });

    it('infers recover from handling patterns', () => {
      expect(inferRoleFromExercise({ slug: 'try-except-basic', pattern: 'handling' })).toBe(
        'recover'
      );
    });

    it('infers transform from mapping patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-comp-map', pattern: 'mapping' })).toBe('transform');
    });

    it('infers query from lookup patterns', () => {
      expect(inferRoleFromExercise({ slug: 'dict-get-key', pattern: 'lookup' })).toBe('query');
    });

    it('infers display from output patterns', () => {
      expect(inferRoleFromExercise({ slug: 'print-basic', pattern: 'output' })).toBe('display');
    });

    describe('slug-based fallbacks', () => {
      it('falls back to create from slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'list-create-empty' })).toBe('create');
      });

      it('falls back to update from append slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'list-append-item' })).toBe('update');
      });

      it('falls back to update from add slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'dict-add-key' })).toBe('update');
      });

      it('falls back to query from check slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'list-in-check' })).toBe('query');
      });

      it('falls back to display from print slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'print-format' })).toBe('display');
      });

      it('falls back to transform from filter slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'list-filter-items' })).toBe('transform');
      });

      it('falls back to persist from file slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'file-read-write' })).toBe('persist');
      });

      it('falls back to guard from if slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'if-else-example' })).toBe('guard');
      });

      it('falls back to recover from try slug hints', () => {
        expect(inferRoleFromExercise({ slug: 'try-except-example' })).toBe('recover');
      });

      it('returns undefined for unrecognized patterns', () => {
        expect(inferRoleFromExercise({ slug: 'unknown-exercise' })).toBeUndefined();
      });
    });
  });
});
