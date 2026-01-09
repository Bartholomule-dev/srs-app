import { describe, it, expect } from 'vitest';
import { applySkinContext, applySkinContextBatch } from '@/lib/paths/apply-skin';
import type { PathIndex, Skin } from '@/lib/paths/types';

function createMockIndex(): PathIndex {
  const skin: Skin = {
    id: 'task-manager',
    title: 'Task Manager',
    icon: '✅',
    blueprints: ['bp-1'],
    vars: {
      list_name: 'tasks',
      item_singular: 'task',
      item_plural: 'tasks',
      item_examples: [],
      record_keys: [],
    },
    contexts: {
      'ex-a': 'Context for exercise A',
      'ex-b': 'Context for exercise B',
    },
  };

  return {
    blueprints: new Map([
      [
        'bp-1',
        {
          id: 'bp-1',
          title: 'Blueprint 1',
          description: 'Test',
          difficulty: 'beginner' as const,
          concepts: [],
          beats: [
            { beat: 1, exercise: 'ex-a', title: 'Step 1' },
            { beat: 2, exercise: 'ex-b', title: 'Step 2' },
          ],
        },
      ],
    ]),
    skins: new Map([['task-manager', skin]]),
    exerciseToBlueprints: new Map([
      ['ex-a', [{ blueprintId: 'bp-1', beat: 1, totalBeats: 2, beatTitle: 'Step 1' }]],
      ['ex-b', [{ blueprintId: 'bp-1', beat: 2, totalBeats: 2, beatTitle: 'Step 2' }]],
    ]),
    exerciseToSkins: new Map([
      ['ex-a', ['task-manager']],
      ['ex-b', ['task-manager']],
    ]),
  };
}

describe('applySkinContext', () => {
  it('creates SkinnedCard with full context', () => {
    const index = createMockIndex();

    const result = applySkinContext('ex-a', 'task-manager', index);

    expect(result).toEqual({
      exerciseSlug: 'ex-a',
      skinId: 'task-manager',
      blueprintId: 'bp-1',
      beat: 1,
      totalBeats: 2,
      beatTitle: 'Step 1',
      context: 'Context for exercise A',
    });
  });

  it('handles missing skin', () => {
    const index = createMockIndex();

    const result = applySkinContext('ex-a', null, index);

    expect(result.skinId).toBeNull();
    expect(result.context).toBeNull();
    // Blueprint info should still be present
    expect(result.blueprintId).toBe('bp-1');
  });

  it('handles exercise with no blueprint', () => {
    const index = createMockIndex();
    index.exerciseToBlueprints.set('standalone', []);

    const result = applySkinContext('standalone', null, index);

    expect(result.blueprintId).toBeNull();
    expect(result.beat).toBeNull();
  });

  it('handles unknown skin ID', () => {
    const index = createMockIndex();

    const result = applySkinContext('ex-a', 'unknown-skin', index);

    expect(result.skinId).toBe('unknown-skin');
    expect(result.context).toBeNull(); // No context found
  });

  it('handles exercise not in index', () => {
    const index = createMockIndex();

    const result = applySkinContext('nonexistent', 'task-manager', index);

    expect(result.exerciseSlug).toBe('nonexistent');
    expect(result.blueprintId).toBeNull();
    expect(result.beat).toBeNull();
    expect(result.context).toBeNull();
  });
});

describe('applySkinContextBatch', () => {
  it('applies context to multiple exercises', () => {
    const index = createMockIndex();
    const exercises = ['ex-a', 'ex-b'];
    const skins = ['task-manager', 'task-manager'];

    const results = applySkinContextBatch(exercises, skins, index);

    expect(results.length).toBe(2);
    expect(results[0].beat).toBe(1);
    expect(results[1].beat).toBe(2);
  });

  it('handles mixed null skins', () => {
    const index = createMockIndex();
    const exercises = ['ex-a', 'ex-b'];
    const skins: (string | null)[] = ['task-manager', null];

    const results = applySkinContextBatch(exercises, skins, index);

    expect(results[0].skinId).toBe('task-manager');
    expect(results[1].skinId).toBeNull();
  });

  it('returns empty array for empty input', () => {
    const index = createMockIndex();

    const results = applySkinContextBatch([], [], index);

    expect(results).toEqual([]);
  });

  it('preserves order of exercises', () => {
    const index = createMockIndex();
    const exercises = ['ex-b', 'ex-a'];
    const skins = ['task-manager', 'task-manager'];

    const results = applySkinContextBatch(exercises, skins, index);

    expect(results[0].exerciseSlug).toBe('ex-b');
    expect(results[1].exerciseSlug).toBe('ex-a');
  });
});
