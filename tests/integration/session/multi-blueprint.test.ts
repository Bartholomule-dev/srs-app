// tests/integration/session/multi-blueprint.test.ts
/**
 * Integration tests for sessions with exercises from multiple blueprints.
 *
 * These tests verify that:
 * 1. Exercises from different blueprints are properly grouped
 * 2. Different skins can be applied to different blueprint groups
 * 3. Beat ordering is maintained within each blueprint
 * 4. Recency tracking works across blueprint groups in the same session
 */
import { describe, it, expect } from 'vitest';
import { groupByBlueprint, sortByBeat } from '@/lib/paths/grouping';
import { selectSkinForExercises } from '@/lib/paths/selector';
import { applySkinContextBatch } from '@/lib/paths/apply-skin';
import { buildPathIndex } from '@/lib/paths/loader';
import type { Blueprint, Skin, PathIndex } from '@/lib/paths/types';

/**
 * Create a test index with two distinct blueprints and their skins.
 * This simulates a real session where user has due exercises from
 * multiple different "build something" narratives.
 */
function createMultiBlueprintIndex(): PathIndex {
  const blueprints: Blueprint[] = [
    {
      id: 'bp-collection',
      title: 'Collection Builder',
      description: 'Build a collection app',
      difficulty: 'beginner',
      concepts: ['lists', 'loops'],
      beats: [
        { beat: 1, exercise: 'list-create-1', title: 'Create storage' },
        { beat: 2, exercise: 'list-append-1', title: 'Add items' },
        { beat: 3, exercise: 'loop-for-1', title: 'Iterate items' },
      ],
    },
    {
      id: 'bp-calculator',
      title: 'Calculator App',
      description: 'Build a calculator',
      difficulty: 'beginner',
      concepts: ['functions', 'conditionals'],
      beats: [
        { beat: 1, exercise: 'func-def-1', title: 'Define operations' },
        { beat: 2, exercise: 'if-else-1', title: 'Handle cases' },
        { beat: 3, exercise: 'func-call-1', title: 'Use functions' },
      ],
    },
  ];

  const skins: Skin[] = [
    // Skins for collection blueprint
    {
      id: 'skin-tasks',
      title: 'Task Manager',
      icon: 'check',
      blueprints: ['bp-collection'],
      vars: {
        list_name: 'tasks',
        item_singular: 'task',
        item_plural: 'tasks',
        item_examples: ['Buy groceries', 'Walk dog'],
        record_keys: ['name', 'done'],
      },
      contexts: {
        'list-create-1': 'Create your task list',
        'list-append-1': 'Add a new task',
        'loop-for-1': 'Show all tasks',
      },
    },
    {
      id: 'skin-playlist',
      title: 'Playlist',
      icon: 'music',
      blueprints: ['bp-collection'],
      vars: {
        list_name: 'playlist',
        item_singular: 'song',
        item_plural: 'songs',
        item_examples: ['Bohemian Rhapsody', 'Stairway'],
        record_keys: ['title', 'artist'],
      },
      contexts: {
        'list-create-1': 'Create your playlist',
        'list-append-1': 'Add a song',
        'loop-for-1': 'Play all songs',
      },
    },
    // Skins for calculator blueprint
    {
      id: 'skin-finance',
      title: 'Finance Calculator',
      icon: 'dollar',
      blueprints: ['bp-calculator'],
      vars: {
        list_name: 'transactions',
        item_singular: 'transaction',
        item_plural: 'transactions',
        item_examples: ['Income', 'Expense'],
        record_keys: ['amount', 'type'],
      },
      contexts: {
        'func-def-1': 'Define calculation functions',
        'if-else-1': 'Handle debit vs credit',
        'func-call-1': 'Calculate balance',
      },
    },
    {
      id: 'skin-grades',
      title: 'Grade Calculator',
      icon: 'book',
      blueprints: ['bp-calculator'],
      vars: {
        list_name: 'grades',
        item_singular: 'grade',
        item_plural: 'grades',
        item_examples: ['A', 'B', 'C'],
        record_keys: ['score', 'weight'],
      },
      contexts: {
        'func-def-1': 'Define grading functions',
        'if-else-1': 'Handle grade boundaries',
        'func-call-1': 'Calculate GPA',
      },
    },
  ];

  return buildPathIndex(blueprints, skins);
}

describe('Multi-Blueprint Sessions', () => {
  describe('groupByBlueprint with multiple blueprints', () => {
    it('groups exercises from different blueprints into separate groups', () => {
      const index = createMultiBlueprintIndex();
      // Session has exercises from both blueprints, interleaved
      const exercises = [
        'list-create-1', // bp-collection, beat 1
        'func-def-1', // bp-calculator, beat 1
        'list-append-1', // bp-collection, beat 2
        'if-else-1', // bp-calculator, beat 2
      ];

      const groups = groupByBlueprint(exercises, index);

      expect(groups).toHaveLength(2);

      const collectionGroup = groups.find((g) => g.blueprintId === 'bp-collection');
      const calculatorGroup = groups.find((g) => g.blueprintId === 'bp-calculator');

      expect(collectionGroup?.exercises).toEqual(['list-create-1', 'list-append-1']);
      expect(calculatorGroup?.exercises).toEqual(['func-def-1', 'if-else-1']);
    });

    it('handles mix of blueprinted and standalone exercises', () => {
      const index = createMultiBlueprintIndex();
      const exercises = [
        'list-create-1', // bp-collection
        'standalone-review', // no blueprint
        'func-def-1', // bp-calculator
        'another-standalone', // no blueprint
      ];

      const groups = groupByBlueprint(exercises, index);

      expect(groups).toHaveLength(3);

      const collectionGroup = groups.find((g) => g.blueprintId === 'bp-collection');
      const calculatorGroup = groups.find((g) => g.blueprintId === 'bp-calculator');
      const standaloneGroup = groups.find((g) => g.blueprintId === null);

      expect(collectionGroup?.exercises).toEqual(['list-create-1']);
      expect(calculatorGroup?.exercises).toEqual(['func-def-1']);
      expect(standaloneGroup?.exercises).toEqual(['standalone-review', 'another-standalone']);
    });
  });

  describe('sortByBeat across multiple blueprints', () => {
    it('maintains correct beat order within each blueprint group', () => {
      const index = createMultiBlueprintIndex();

      // Exercises from bp-collection in wrong order
      const collectionExercises = ['loop-for-1', 'list-create-1', 'list-append-1'];
      const sortedCollection = sortByBeat(collectionExercises, 'bp-collection', index);
      expect(sortedCollection).toEqual(['list-create-1', 'list-append-1', 'loop-for-1']);

      // Exercises from bp-calculator in wrong order
      const calculatorExercises = ['func-call-1', 'func-def-1', 'if-else-1'];
      const sortedCalculator = sortByBeat(calculatorExercises, 'bp-calculator', index);
      expect(sortedCalculator).toEqual(['func-def-1', 'if-else-1', 'func-call-1']);
    });
  });

  describe('selectSkinForExercises with multiple blueprints', () => {
    it('applies different skins to different blueprint groups', () => {
      const index = createMultiBlueprintIndex();
      const exercises = [
        'list-create-1', // bp-collection
        'list-append-1', // bp-collection
        'func-def-1', // bp-calculator
        'if-else-1', // bp-calculator
      ];

      const skins = selectSkinForExercises(exercises, [], index);

      // Collection exercises should have same skin (tasks or playlist)
      expect(skins[0]?.id).toBe(skins[1]?.id);
      expect(['skin-tasks', 'skin-playlist']).toContain(skins[0]?.id);

      // Calculator exercises should have same skin (finance or grades)
      expect(skins[2]?.id).toBe(skins[3]?.id);
      expect(['skin-finance', 'skin-grades']).toContain(skins[2]?.id);
    });

    it('tracks recency across blueprint groups within session', () => {
      const index = createMultiBlueprintIndex();

      // Pre-populate recent skins to force specific selections
      // If tasks is recent, collection should pick playlist
      // If finance is recent, calculator should pick grades
      const recentSkins = ['skin-tasks', 'skin-finance'];

      const exercises = [
        'list-create-1', // bp-collection
        'func-def-1', // bp-calculator
      ];

      // Run multiple times to verify recency is respected
      const results = Array.from({ length: 10 }, () =>
        selectSkinForExercises(exercises, recentSkins, index)
      );

      // Collection exercises should always get playlist (tasks is recent)
      expect(results.every((r) => r[0]?.id === 'skin-playlist')).toBe(true);

      // Calculator exercises should always get grades (finance is recent)
      expect(results.every((r) => r[1]?.id === 'skin-grades')).toBe(true);
    });

    it('updates batch recency to avoid repeating same skin for different blueprints', () => {
      // Create index where both blueprints share a global skin
      const blueprints: Blueprint[] = [
        {
          id: 'bp-a',
          title: 'Blueprint A',
          description: 'Test A',
          difficulty: 'beginner',
          concepts: ['lists'],
          beats: [{ beat: 1, exercise: 'ex-a', title: 'Step A' }],
        },
        {
          id: 'bp-b',
          title: 'Blueprint B',
          description: 'Test B',
          difficulty: 'beginner',
          concepts: ['functions'],
          beats: [{ beat: 1, exercise: 'ex-b', title: 'Step B' }],
        },
      ];

      // Create skins that work for both blueprints (or are global)
      const skins: Skin[] = [
        {
          id: 'shared-skin-1',
          title: 'Shared 1',
          icon: 'a',
          blueprints: ['bp-a', 'bp-b'],
          vars: { list_name: 'items', item_singular: 'item', item_plural: 'items', item_examples: [], record_keys: [] },
          contexts: { 'ex-a': 'Context A1', 'ex-b': 'Context B1' },
        },
        {
          id: 'shared-skin-2',
          title: 'Shared 2',
          icon: 'b',
          blueprints: ['bp-a', 'bp-b'],
          vars: { list_name: 'things', item_singular: 'thing', item_plural: 'things', item_examples: [], record_keys: [] },
          contexts: { 'ex-a': 'Context A2', 'ex-b': 'Context B2' },
        },
      ];

      const index = buildPathIndex(blueprints, skins);
      const exercises = ['ex-a', 'ex-b'];

      // Run multiple times to see if algorithm tries to pick different skins
      // for different blueprint groups within the same batch
      const results: [string | undefined, string | undefined][] = [];
      for (let i = 0; i < 20; i++) {
        const selected = selectSkinForExercises(exercises, [], index);
        results.push([selected[0]?.id, selected[1]?.id]);
      }

      // With batch recency tracking, after selecting skin for bp-a,
      // the algorithm should prefer a different skin for bp-b
      // At minimum, we should see some variation in the results
      const differentSkinsPicked = results.filter(([a, b]) => a !== b).length;

      // Should pick different skins for different blueprints at least sometimes
      // (unless both blueprints need the same skin for compatibility reasons)
      expect(differentSkinsPicked).toBeGreaterThan(0);
    });
  });

  describe('applySkinContextBatch with multiple blueprints', () => {
    it('provides correct blueprint context for each exercise', () => {
      const index = createMultiBlueprintIndex();
      const exercises = [
        'list-create-1', // bp-collection, beat 1 of 3
        'func-def-1', // bp-calculator, beat 1 of 3
      ];
      const skinIds = ['skin-tasks', 'skin-finance'];

      const skinnedCards = applySkinContextBatch(exercises, skinIds, index);

      // First card - collection blueprint
      expect(skinnedCards[0].exerciseSlug).toBe('list-create-1');
      expect(skinnedCards[0].blueprintId).toBe('bp-collection');
      expect(skinnedCards[0].beat).toBe(1);
      expect(skinnedCards[0].totalBeats).toBe(3);
      expect(skinnedCards[0].skinId).toBe('skin-tasks');
      expect(skinnedCards[0].context).toBe('Create your task list');

      // Second card - calculator blueprint
      expect(skinnedCards[1].exerciseSlug).toBe('func-def-1');
      expect(skinnedCards[1].blueprintId).toBe('bp-calculator');
      expect(skinnedCards[1].beat).toBe(1);
      expect(skinnedCards[1].totalBeats).toBe(3);
      expect(skinnedCards[1].skinId).toBe('skin-finance');
      expect(skinnedCards[1].context).toBe('Define calculation functions');
    });

    it('handles null skins for some blueprint groups', () => {
      const index = createMultiBlueprintIndex();
      const exercises = [
        'list-create-1', // bp-collection
        'func-def-1', // bp-calculator
      ];
      // Only first exercise gets a skin
      const skinIds = ['skin-tasks', null];

      const skinnedCards = applySkinContextBatch(exercises, skinIds, index);

      expect(skinnedCards[0].skinId).toBe('skin-tasks');
      expect(skinnedCards[0].context).toBe('Create your task list');

      expect(skinnedCards[1].skinId).toBeNull();
      expect(skinnedCards[1].context).toBeNull(); // No context without skin
      // But blueprint info should still be present
      expect(skinnedCards[1].blueprintId).toBe('bp-calculator');
      expect(skinnedCards[1].beat).toBe(1);
    });
  });

  describe('Full multi-blueprint session flow', () => {
    it('correctly processes a session with exercises from multiple blueprints', () => {
      const index = createMultiBlueprintIndex();

      // Simulate a session with exercises from both blueprints, out of order
      const sessionExercises = [
        'loop-for-1', // bp-collection, beat 3
        'func-def-1', // bp-calculator, beat 1
        'list-create-1', // bp-collection, beat 1
        'if-else-1', // bp-calculator, beat 2
        'standalone-ex', // no blueprint
        'list-append-1', // bp-collection, beat 2
      ];

      // Step 1: Group by blueprint
      const groups = groupByBlueprint(sessionExercises, index);

      // Step 2: Sort each group by beat and collect
      const orderedExercises: string[] = [];
      for (const group of groups) {
        const sorted = sortByBeat(group.exercises, group.blueprintId, index);
        orderedExercises.push(...sorted);
      }

      // Step 3: Select skins
      const selectedSkins = selectSkinForExercises(orderedExercises, [], index);

      // Step 4: Apply skin context
      const skinnedCards = applySkinContextBatch(
        orderedExercises,
        selectedSkins.map((s) => s?.id ?? null),
        index
      );

      // Verify ordering: each blueprint's exercises should be in beat order
      const collectionCards = skinnedCards.filter((c) => c.blueprintId === 'bp-collection');
      const calculatorCards = skinnedCards.filter((c) => c.blueprintId === 'bp-calculator');
      const standaloneCards = skinnedCards.filter((c) => c.blueprintId === null);

      // Collection should be beat 1, 2, 3
      expect(collectionCards.map((c) => c.beat)).toEqual([1, 2, 3]);
      expect(collectionCards.map((c) => c.exerciseSlug)).toEqual([
        'list-create-1',
        'list-append-1',
        'loop-for-1',
      ]);

      // Calculator should be beat 1, 2
      expect(calculatorCards.map((c) => c.beat)).toEqual([1, 2]);
      expect(calculatorCards.map((c) => c.exerciseSlug)).toEqual([
        'func-def-1',
        'if-else-1',
      ]);

      // Standalone should be present
      expect(standaloneCards).toHaveLength(1);
      expect(standaloneCards[0].exerciseSlug).toBe('standalone-ex');

      // Verify skin consistency within blueprints
      const collectionSkinIds = new Set(collectionCards.map((c) => c.skinId));
      const calculatorSkinIds = new Set(calculatorCards.map((c) => c.skinId));

      expect(collectionSkinIds.size).toBe(1); // All same skin
      expect(calculatorSkinIds.size).toBe(1); // All same skin
    });

    it('preserves teaching card positions when processing blueprints', () => {
      // This test ensures that the multi-blueprint grouping doesn't break
      // the teaching card interleaving logic (which happens after grouping)
      const index = createMultiBlueprintIndex();

      // Simulated review cards that would come from SRS
      const reviewExercises = [
        'list-create-1', // bp-collection
        'func-def-1', // bp-calculator
      ];

      // Group and sort (as useConceptSession does before interleaving)
      const groups = groupByBlueprint(reviewExercises, index);
      const orderedExercises: string[] = [];
      for (const group of groups) {
        const sorted = sortByBeat(group.exercises, group.blueprintId, index);
        orderedExercises.push(...sorted);
      }

      // The ordered exercises should be ready for teaching card interleaving
      expect(orderedExercises).toHaveLength(2);
      // Both should have blueprint assignments
      for (const slug of orderedExercises) {
        const bpRefs = index.exerciseToBlueprints.get(slug);
        expect(bpRefs).toBeDefined();
        expect(bpRefs!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases', () => {
    it('handles session with all exercises from one blueprint', () => {
      const index = createMultiBlueprintIndex();
      const exercises = ['list-create-1', 'list-append-1', 'loop-for-1'];

      const groups = groupByBlueprint(exercises, index);

      expect(groups).toHaveLength(1);
      expect(groups[0].blueprintId).toBe('bp-collection');
    });

    it('handles session with no blueprinted exercises', () => {
      const index = createMultiBlueprintIndex();
      const exercises = ['standalone-1', 'standalone-2', 'standalone-3'];

      const groups = groupByBlueprint(exercises, index);

      expect(groups).toHaveLength(1);
      expect(groups[0].blueprintId).toBeNull();
      expect(groups[0].exercises).toEqual(['standalone-1', 'standalone-2', 'standalone-3']);
    });

    it('handles exercise that belongs to multiple blueprints', () => {
      // Create index with shared exercise
      const blueprints: Blueprint[] = [
        {
          id: 'bp-a',
          title: 'Blueprint A',
          description: 'Test',
          difficulty: 'beginner',
          concepts: [],
          beats: [
            { beat: 1, exercise: 'shared-ex', title: 'Shared Step' },
            { beat: 2, exercise: 'ex-a-only', title: 'A Only' },
          ],
        },
        {
          id: 'bp-b',
          title: 'Blueprint B',
          description: 'Test',
          difficulty: 'beginner',
          concepts: [],
          beats: [
            { beat: 1, exercise: 'shared-ex', title: 'Shared Step' },
            { beat: 2, exercise: 'ex-b-only', title: 'B Only' },
          ],
        },
      ];

      const index = buildPathIndex(blueprints, []);

      // Exercise belongs to both blueprints
      const sharedRefs = index.exerciseToBlueprints.get('shared-ex');
      expect(sharedRefs).toHaveLength(2);

      // When grouping, shared exercise goes to first blueprint only
      const exercises = ['shared-ex', 'ex-a-only'];
      const groups = groupByBlueprint(exercises, index);

      // Should only have one group (first blueprint wins)
      expect(groups).toHaveLength(1);
      expect(groups[0].blueprintId).toBe('bp-a');
      expect(groups[0].exercises).toEqual(['shared-ex', 'ex-a-only']);
    });
  });
});
