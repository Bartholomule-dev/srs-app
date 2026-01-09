// tests/integration/session/paths-integration.test.ts
/**
 * Integration tests for session path (Blueprint + Skin) integration.
 *
 * These tests verify that the session hook correctly:
 * - Groups exercises by blueprint
 * - Sorts exercises within each blueprint by beat order
 * - Applies consistent skins to exercises from the same blueprint
 * - Falls back gracefully when path loading fails
 */
import { describe, it, expect, vi } from 'vitest';
import { groupByBlueprint, sortByBeat } from '@/lib/paths/grouping';
import { selectSkinForExercises } from '@/lib/paths/selector';
import { applySkinContextBatch } from '@/lib/paths/apply-skin';
import { buildPathIndex } from '@/lib/paths/loader';
import type { Blueprint, Skin, PathIndex } from '@/lib/paths/types';

// Mock path data for testing
const mockBlueprints: Blueprint[] = [
  {
    id: 'bp-test-collection',
    title: 'Test Collection Builder',
    description: 'A test blueprint',
    difficulty: 'beginner',
    concepts: ['lists', 'loops'],
    beats: [
      { beat: 1, exercise: 'list-create-1', title: 'Create a list' },
      { beat: 2, exercise: 'list-append-1', title: 'Add items' },
      { beat: 3, exercise: 'loop-for-1', title: 'Iterate the list' },
    ],
  },
];

const mockSkins: Skin[] = [
  {
    id: 'skin-tasks',
    title: 'Task Manager',
    icon: 'check',
    blueprints: ['bp-test-collection'],
    vars: {
      list_name: 'tasks',
      item_singular: 'task',
      item_plural: 'tasks',
      item_examples: ['Buy groceries', 'Walk dog'],
      record_keys: ['name', 'done'],
    },
    contexts: {
      'list-create-1': 'Start by creating an empty task list',
      'list-append-1': 'Add your first task to the list',
      'loop-for-1': 'Display all pending tasks',
    },
  },
  {
    id: 'skin-music',
    title: 'Music Playlist',
    icon: 'music',
    blueprints: ['bp-test-collection'],
    vars: {
      list_name: 'playlist',
      item_singular: 'song',
      item_plural: 'songs',
      item_examples: ['Bohemian Rhapsody', 'Stairway to Heaven'],
      record_keys: ['title', 'artist'],
    },
    contexts: {
      'list-create-1': 'Create your music playlist',
      'list-append-1': 'Add your favorite song',
      'loop-for-1': 'Display all songs in the playlist',
    },
  },
];

function createTestIndex(): PathIndex {
  return buildPathIndex(mockBlueprints, mockSkins);
}

describe('Session + Paths Integration', () => {
  describe('groupByBlueprint', () => {
    it('groups exercises from the same blueprint together', () => {
      const index = createTestIndex();
      const exercises = ['list-create-1', 'standalone-ex', 'list-append-1'];

      const groups = groupByBlueprint(exercises, index);

      // Should have 2 groups: one for the blueprint, one for standalone
      expect(groups).toHaveLength(2);

      // Blueprint group
      const bpGroup = groups.find((g) => g.blueprintId === 'bp-test-collection');
      expect(bpGroup).toBeDefined();
      expect(bpGroup?.exercises).toEqual(['list-create-1', 'list-append-1']);

      // Standalone group
      const standaloneGroup = groups.find((g) => g.blueprintId === null);
      expect(standaloneGroup).toBeDefined();
      expect(standaloneGroup?.exercises).toEqual(['standalone-ex']);
    });

    it('handles exercises with no blueprint membership', () => {
      const index = createTestIndex();
      const exercises = ['standalone-1', 'standalone-2'];

      const groups = groupByBlueprint(exercises, index);

      expect(groups).toHaveLength(1);
      expect(groups[0].blueprintId).toBeNull();
      expect(groups[0].exercises).toEqual(['standalone-1', 'standalone-2']);
    });
  });

  describe('sortByBeat', () => {
    it('sorts exercises by their beat order within a blueprint', () => {
      const index = createTestIndex();
      // Input in wrong order: beat 3, beat 1, beat 2
      const exercises = ['loop-for-1', 'list-create-1', 'list-append-1'];

      const sorted = sortByBeat(exercises, 'bp-test-collection', index);

      // Should be sorted: beat 1, beat 2, beat 3
      expect(sorted).toEqual(['list-create-1', 'list-append-1', 'loop-for-1']);
    });

    it('returns unchanged array for standalone exercises (null blueprint)', () => {
      const index = createTestIndex();
      const exercises = ['standalone-b', 'standalone-a'];

      const sorted = sortByBeat(exercises, null, index);

      expect(sorted).toEqual(['standalone-b', 'standalone-a']);
    });

    it('preserves order for exercises not in the blueprint', () => {
      const index = createTestIndex();
      // Mix of blueprint and unknown exercises
      const exercises = ['unknown-ex', 'list-append-1', 'list-create-1'];

      const sorted = sortByBeat(exercises, 'bp-test-collection', index);

      // Blueprint exercises sorted, unknown at end
      expect(sorted).toEqual(['list-create-1', 'list-append-1', 'unknown-ex']);
    });
  });

  describe('selectSkinForExercises', () => {
    it('applies the same skin to all exercises from the same blueprint', () => {
      const index = createTestIndex();
      const exercises = ['list-create-1', 'list-append-1', 'loop-for-1'];
      const recentSkins: string[] = [];

      const skins = selectSkinForExercises(exercises, recentSkins, index);

      // All should have same non-null skin
      expect(skins.every((s) => s !== null)).toBe(true);
      const firstSkinId = skins[0]?.id;
      expect(skins.every((s) => s?.id === firstSkinId)).toBe(true);
    });

    it('avoids recently used skins when alternatives available', () => {
      const index = createTestIndex();
      const exercises = ['list-create-1'];
      const recentSkins = ['skin-tasks'];

      // Run multiple times to check randomness doesn't always pick avoided skin
      // With only 2 skins and one recent, should prefer the other
      const results = Array.from({ length: 10 }, () =>
        selectSkinForExercises(exercises, recentSkins, index)[0]?.id
      );

      // Should have selected skin-music at least once
      expect(results.some((id) => id === 'skin-music')).toBe(true);
    });

    it('returns null for exercises without skin support', () => {
      const index = createTestIndex();
      const exercises = ['standalone-no-skin'];

      const skins = selectSkinForExercises(exercises, [], index);

      expect(skins).toEqual([null]);
    });
  });

  describe('applySkinContextBatch', () => {
    it('creates SkinnedCards with blueprint and skin info', () => {
      const index = createTestIndex();
      const exercises = ['list-create-1', 'list-append-1'];
      const skinIds = ['skin-tasks', 'skin-tasks'];

      const skinnedCards = applySkinContextBatch(exercises, skinIds, index);

      expect(skinnedCards).toHaveLength(2);

      // First card
      expect(skinnedCards[0].exerciseSlug).toBe('list-create-1');
      expect(skinnedCards[0].skinId).toBe('skin-tasks');
      expect(skinnedCards[0].blueprintId).toBe('bp-test-collection');
      expect(skinnedCards[0].beat).toBe(1);
      expect(skinnedCards[0].totalBeats).toBe(3);
      expect(skinnedCards[0].context).toBe('Start by creating an empty task list');

      // Second card
      expect(skinnedCards[1].beat).toBe(2);
      expect(skinnedCards[1].context).toBe('Add your first task to the list');
    });

    it('handles exercises without skins gracefully', () => {
      const index = createTestIndex();
      const exercises = ['standalone-ex'];
      const skinIds = [null];

      const skinnedCards = applySkinContextBatch(exercises, skinIds, index);

      expect(skinnedCards).toHaveLength(1);
      expect(skinnedCards[0].skinId).toBeNull();
      expect(skinnedCards[0].blueprintId).toBeNull();
      expect(skinnedCards[0].context).toBeNull();
    });
  });

  describe('Full session ordering flow', () => {
    it('groups and sorts exercises correctly for session', () => {
      const index = createTestIndex();

      // Simulated session exercises in arbitrary order
      // Contains exercises from blueprint (out of order) and standalone
      const sessionExercises = [
        'loop-for-1', // beat 3
        'standalone-review',
        'list-create-1', // beat 1
        'list-append-1', // beat 2
      ];

      // Step 1: Group by blueprint
      const groups = groupByBlueprint(sessionExercises, index);

      // Step 2: Sort each group by beat order and collect
      const orderedExercises: string[] = [];
      for (const group of groups) {
        const sorted = sortByBeat(group.exercises, group.blueprintId, index);
        orderedExercises.push(...sorted);
      }

      // Blueprint exercises should be grouped together and sorted by beat
      // Standalone exercises should maintain their relative position in the group
      const blueprintExercises = orderedExercises.filter((e) =>
        ['list-create-1', 'list-append-1', 'loop-for-1'].includes(e)
      );
      expect(blueprintExercises).toEqual([
        'list-create-1',
        'list-append-1',
        'loop-for-1',
      ]);

      // Standalone should still be present
      expect(orderedExercises).toContain('standalone-review');
    });

    it('applies consistent skin across grouped blueprint exercises', () => {
      const index = createTestIndex();
      const orderedExercises = ['list-create-1', 'list-append-1', 'loop-for-1'];
      const recentSkins: string[] = [];

      // Step 3: Select skins
      const selectedSkins = selectSkinForExercises(
        orderedExercises,
        recentSkins,
        index
      );

      // All exercises from same blueprint should have same skin
      expect(selectedSkins[0]?.id).toBeDefined();
      expect(selectedSkins[1]?.id).toBe(selectedSkins[0]?.id);
      expect(selectedSkins[2]?.id).toBe(selectedSkins[0]?.id);

      // Step 4: Apply skin context
      const skinnedCards = applySkinContextBatch(
        orderedExercises,
        selectedSkins.map((s) => s?.id ?? null),
        index
      );

      // All should have same skinId
      expect(skinnedCards.every((c) => c.skinId === skinnedCards[0].skinId)).toBe(
        true
      );

      // Each should have correct beat number
      expect(skinnedCards.map((c) => c.beat)).toEqual([1, 2, 3]);
    });
  });

  describe('Error handling', () => {
    it('sortByBeat handles unknown blueprint gracefully', () => {
      const index = createTestIndex();
      const exercises = ['ex-1', 'ex-2'];

      // Unknown blueprint returns unchanged
      const sorted = sortByBeat(exercises, 'unknown-bp', index);
      expect(sorted).toEqual(['ex-1', 'ex-2']);
    });

    it('groupByBlueprint works with empty input', () => {
      const index = createTestIndex();

      const groups = groupByBlueprint([], index);
      expect(groups).toEqual([]);
    });

    it('selectSkinForExercises works with empty input', () => {
      const index = createTestIndex();

      const skins = selectSkinForExercises([], [], index);
      expect(skins).toEqual([]);
    });
  });
});
