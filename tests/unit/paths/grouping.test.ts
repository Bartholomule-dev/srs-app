// tests/unit/paths/grouping.test.ts
import { describe, it, expect } from 'vitest';
import { groupByBlueprint, sortByBeat, BlueprintGroup } from '@/lib/paths/grouping';
import type { PathIndex } from '@/lib/paths/types';

function createMockIndex(): PathIndex {
  return {
    blueprints: new Map([
      ['bp-1', {
        id: 'bp-1',
        title: 'Blueprint 1',
        description: 'Test',
        difficulty: 'beginner' as const,
        concepts: [],
        beats: [
          { beat: 1, exercise: 'ex-a', title: 'Step 1' },
          { beat: 2, exercise: 'ex-b', title: 'Step 2' },
          { beat: 3, exercise: 'ex-c', title: 'Step 3' },
        ],
      }],
    ]),
    skins: new Map(),
    exerciseToBlueprints: new Map([
      ['ex-a', [{ blueprintId: 'bp-1', beat: 1, totalBeats: 3, beatTitle: 'Step 1' }]],
      ['ex-b', [{ blueprintId: 'bp-1', beat: 2, totalBeats: 3, beatTitle: 'Step 2' }]],
      ['ex-c', [{ blueprintId: 'bp-1', beat: 3, totalBeats: 3, beatTitle: 'Step 3' }]],
      ['ex-standalone', []],
    ]),
    exerciseToSkins: new Map(),
  };
}

describe('Blueprint Grouping', () => {
  describe('groupByBlueprint', () => {
    it('groups exercises from the same blueprint', () => {
      const index = createMockIndex();
      const exercises = ['ex-a', 'ex-c', 'ex-b']; // Out of order

      const groups = groupByBlueprint(exercises, index);

      expect(groups.length).toBe(1);
      expect(groups[0].blueprintId).toBe('bp-1');
      expect(groups[0].exercises).toEqual(['ex-a', 'ex-c', 'ex-b']);
    });

    it('creates separate group for standalone exercises', () => {
      const index = createMockIndex();
      const exercises = ['ex-a', 'ex-standalone', 'ex-b'];

      const groups = groupByBlueprint(exercises, index);

      // One blueprint group, one standalone
      const bpGroup = groups.find(g => g.blueprintId === 'bp-1');
      const standaloneGroup = groups.find(g => g.blueprintId === null);

      expect(bpGroup?.exercises).toEqual(['ex-a', 'ex-b']);
      expect(standaloneGroup?.exercises).toEqual(['ex-standalone']);
    });

    it('returns empty array for empty input', () => {
      const index = createMockIndex();
      const groups = groupByBlueprint([], index);

      expect(groups).toEqual([]);
    });

    it('handles exercises not in index', () => {
      const index = createMockIndex();
      const exercises = ['ex-a', 'unknown-exercise'];

      const groups = groupByBlueprint(exercises, index);

      const bpGroup = groups.find(g => g.blueprintId === 'bp-1');
      const standaloneGroup = groups.find(g => g.blueprintId === null);

      expect(bpGroup?.exercises).toEqual(['ex-a']);
      expect(standaloneGroup?.exercises).toEqual(['unknown-exercise']);
    });

    it('groups exercises from multiple blueprints separately', () => {
      const index = createMockIndex();
      // Add a second blueprint
      index.blueprints.set('bp-2', {
        id: 'bp-2',
        title: 'Blueprint 2',
        description: 'Test 2',
        difficulty: 'intermediate',
        concepts: [],
        beats: [
          { beat: 1, exercise: 'ex-d', title: 'Step A' },
          { beat: 2, exercise: 'ex-e', title: 'Step B' },
        ],
      });
      index.exerciseToBlueprints.set('ex-d', [{ blueprintId: 'bp-2', beat: 1, totalBeats: 2, beatTitle: 'Step A' }]);
      index.exerciseToBlueprints.set('ex-e', [{ blueprintId: 'bp-2', beat: 2, totalBeats: 2, beatTitle: 'Step B' }]);

      const exercises = ['ex-a', 'ex-d', 'ex-b', 'ex-e'];

      const groups = groupByBlueprint(exercises, index);

      expect(groups.length).toBe(2);

      const bp1Group = groups.find(g => g.blueprintId === 'bp-1');
      const bp2Group = groups.find(g => g.blueprintId === 'bp-2');

      expect(bp1Group?.exercises).toEqual(['ex-a', 'ex-b']);
      expect(bp2Group?.exercises).toEqual(['ex-d', 'ex-e']);
    });
  });

  describe('sortByBeat', () => {
    it('sorts exercises by beat order within blueprint', () => {
      const index = createMockIndex();
      const exercises = ['ex-c', 'ex-a', 'ex-b']; // beats 3, 1, 2

      const sorted = sortByBeat(exercises, 'bp-1', index);

      expect(sorted).toEqual(['ex-a', 'ex-b', 'ex-c']);
    });

    it('preserves order for exercises not in blueprint', () => {
      const index = createMockIndex();
      const exercises = ['ex-standalone', 'other'];

      const sorted = sortByBeat(exercises, null, index);

      expect(sorted).toEqual(['ex-standalone', 'other']);
    });

    it('handles unknown blueprint gracefully', () => {
      const index = createMockIndex();
      const exercises = ['ex-a', 'ex-b'];

      const sorted = sortByBeat(exercises, 'unknown-bp', index);

      expect(sorted).toEqual(['ex-a', 'ex-b']); // Unchanged
    });

    it('places exercises not in blueprint at the end', () => {
      const index = createMockIndex();
      const exercises = ['ex-c', 'unknown', 'ex-a', 'ex-b'];

      const sorted = sortByBeat(exercises, 'bp-1', index);

      // ex-a (beat 1), ex-b (beat 2), ex-c (beat 3), unknown (Infinity)
      expect(sorted).toEqual(['ex-a', 'ex-b', 'ex-c', 'unknown']);
    });

    it('does not mutate original array', () => {
      const index = createMockIndex();
      const exercises = ['ex-c', 'ex-a', 'ex-b'];
      const original = [...exercises];

      sortByBeat(exercises, 'bp-1', index);

      expect(exercises).toEqual(original);
    });

    it('handles empty array', () => {
      const index = createMockIndex();
      const sorted = sortByBeat([], 'bp-1', index);

      expect(sorted).toEqual([]);
    });
  });
});
