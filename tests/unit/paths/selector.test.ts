import { describe, it, expect } from 'vitest';
import { selectSkin, selectSkinForExercises, getRecencyWindow } from '@/lib/paths/selector';
import type { PathIndex, Skin } from '@/lib/paths/types';

// Create a mock index for testing
function createMockIndex(): PathIndex {
  const skins: Skin[] = [
    {
      id: 'task-manager',
      title: 'Task Manager',
      icon: '✅',
      blueprints: ['collection-cli-app'],
      vars: { list_name: 'tasks', item_singular: 'task', item_plural: 'tasks', item_examples: [], record_keys: [] },
      contexts: { 'list-create-empty': 'Context A' },
    },
    {
      id: 'shopping-cart',
      title: 'Shopping Cart',
      icon: '🛒',
      blueprints: ['collection-cli-app'],
      vars: { list_name: 'cart', item_singular: 'item', item_plural: 'items', item_examples: [], record_keys: [] },
      contexts: { 'list-create-empty': 'Context B' },
    },
    {
      id: 'playlist-app',
      title: 'Playlist App',
      icon: '🎵',
      blueprints: ['collection-cli-app'],
      vars: { list_name: 'playlist', item_singular: 'song', item_plural: 'songs', item_examples: [], record_keys: [] },
      contexts: { 'list-create-empty': 'Context C' },
    },
  ];

  return {
    blueprints: new Map(),
    skins: new Map(skins.map(s => [s.id, s])),
    // Map exercises to blueprints so selectSkinForExercises groups them correctly
    exerciseToBlueprints: new Map([
      ['list-create-empty', [{ blueprintId: 'collection-cli-app', beat: 1, totalBeats: 2, beatTitle: 'Create storage' }]],
      ['list-append-dynamic', [{ blueprintId: 'collection-cli-app', beat: 2, totalBeats: 2, beatTitle: 'Add entries' }]],
    ]),
    exerciseToSkins: new Map([
      ['list-create-empty', ['task-manager', 'shopping-cart', 'playlist-app']],
      ['list-append-dynamic', ['task-manager', 'shopping-cart']],
      ['no-skin-exercise', []],
    ]),
  };
}

describe('Skin Selector', () => {
  describe('selectSkin', () => {
    it('returns null for exercises with no compatible skins', () => {
      const index = createMockIndex();
      const result = selectSkin('no-skin-exercise', [], index);

      expect(result).toBeNull();
    });

    it('selects a skin from compatible options', () => {
      const index = createMockIndex();
      const result = selectSkin('list-create-empty', [], index);

      expect(result).not.toBeNull();
      expect(['task-manager', 'shopping-cart', 'playlist-app']).toContain(result?.id);
    });

    it('avoids recently used skins', () => {
      const index = createMockIndex();
      const recentSkins = ['task-manager', 'shopping-cart'];

      // Run multiple times to verify it avoids recent skins
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const result = selectSkin('list-create-empty', recentSkins, index);
        if (result) results.push(result.id);
      }

      // Should always select playlist-app since others are recent
      expect(results.every(id => id === 'playlist-app')).toBe(true);
    });

    it('falls back to all skins when all are recent', () => {
      const index = createMockIndex();
      const recentSkins = ['task-manager', 'shopping-cart', 'playlist-app'];

      const result = selectSkin('list-create-empty', recentSkins, index);

      // Should still return a skin even if all are recent
      expect(result).not.toBeNull();
    });
  });

  describe('selectSkinForExercises', () => {
    it('applies same skin to exercises from same blueprint', () => {
      const index = createMockIndex();
      const exercises = ['list-create-empty', 'list-append-dynamic'];

      const result = selectSkinForExercises(exercises, [], index);

      // Both exercises should get the same skin
      const skinIds = new Set(result.map(r => r?.id));
      expect(skinIds.size).toBe(1);
    });

    it('handles exercises with no compatible skins', () => {
      const index = createMockIndex();
      const exercises = ['no-skin-exercise', 'list-create-empty'];

      const result = selectSkinForExercises(exercises, [], index);

      expect(result[0]).toBeNull();
      expect(result[1]).not.toBeNull();
    });
  });

  describe('getRecencyWindow', () => {
    it('returns the recency window size', () => {
      expect(getRecencyWindow()).toBe(3);
    });
  });

  describe('global skins', () => {
    // Create an index with both blueprint-specific and global skins
    function createIndexWithGlobalSkins(): PathIndex {
      const skins: Skin[] = [
        {
          id: 'task-manager',
          title: 'Task Manager',
          icon: '✅',
          blueprints: ['collection-cli-app'],
          vars: { list_name: 'tasks', item_singular: 'task', item_plural: 'tasks', item_examples: [], record_keys: [] },
          contexts: { 'list-create-empty': 'Task Manager context' },
        },
        {
          id: 'global-skin-1',
          title: 'Global Skin 1',
          icon: '🌐',
          // No blueprints field - this is a global skin
          vars: { list_name: 'items', item_singular: 'item', item_plural: 'items', item_examples: [], record_keys: [] },
          contexts: { 'list-create-empty': 'Global context 1' },
        },
        {
          id: 'global-skin-2',
          title: 'Global Skin 2',
          icon: '🌍',
          blueprints: [], // Empty blueprints array - also a global skin
          vars: { list_name: 'things', item_singular: 'thing', item_plural: 'things', item_examples: [], record_keys: [] },
          contexts: {},
        },
      ];

      return {
        blueprints: new Map(),
        skins: new Map(skins.map(s => [s.id, s])),
        exerciseToBlueprints: new Map([
          ['list-create-empty', [{ blueprintId: 'collection-cli-app', beat: 1, totalBeats: 2, beatTitle: 'Create storage' }]],
        ]),
        // Only task-manager is blueprint-specific, but global skins should also be available
        exerciseToSkins: new Map([
          ['list-create-empty', ['task-manager']],
        ]),
      };
    }

    describe('selectSkin', () => {
      it('includes global skins in candidate pool', () => {
        const index = createIndexWithGlobalSkins();

        // Run multiple times to check distribution
        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
          const result = selectSkin('list-create-empty', [], index);
          if (result) results.add(result.id);
        }

        // Should include both blueprint-specific and global skins
        expect(results.has('task-manager')).toBe(true);
        expect(results.has('global-skin-1')).toBe(true);
        expect(results.has('global-skin-2')).toBe(true);
      });

      it('uses global skins for exercises without blueprint-specific skins', () => {
        const index = createIndexWithGlobalSkins();
        // Add an exercise that has no blueprint-specific skins
        index.exerciseToSkins.set('standalone-exercise', []);

        const result = selectSkin('standalone-exercise', [], index);

        // Should return a global skin
        expect(result).not.toBeNull();
        expect(['global-skin-1', 'global-skin-2']).toContain(result?.id);
      });

      it('respects recency for global skins', () => {
        const index = createIndexWithGlobalSkins();
        const recentSkins = ['task-manager', 'global-skin-1', 'global-skin-2'];

        // All skins are recent, should still return one
        const result = selectSkin('list-create-empty', recentSkins, index);
        expect(result).not.toBeNull();
      });

      it('avoids recent global skins when fresh options exist', () => {
        const index = createIndexWithGlobalSkins();
        const recentSkins = ['task-manager', 'global-skin-1'];

        // Run multiple times - should always pick global-skin-2 since others are recent
        const results: string[] = [];
        for (let i = 0; i < 10; i++) {
          const result = selectSkin('list-create-empty', recentSkins, index);
          if (result) results.push(result.id);
        }

        expect(results.every(id => id === 'global-skin-2')).toBe(true);
      });
    });

    describe('selectSkinForExercises', () => {
      it('includes global skins when selecting for blueprint groups', () => {
        const index = createIndexWithGlobalSkins();
        // Add another exercise in the same blueprint
        index.exerciseToBlueprints.set('list-append-dynamic', [
          { blueprintId: 'collection-cli-app', beat: 2, totalBeats: 2, beatTitle: 'Add entries' },
        ]);
        index.exerciseToSkins.set('list-append-dynamic', ['task-manager']);

        // Run multiple times to check that global skins are included
        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
          const skins = selectSkinForExercises(['list-create-empty', 'list-append-dynamic'], [], index);
          if (skins[0]) results.add(skins[0].id);
        }

        // Should include global skins in the pool
        expect(results.size).toBeGreaterThan(1);
      });

      it('uses global skins for standalone exercises without blueprint-specific skins', () => {
        const index = createIndexWithGlobalSkins();
        // Add a standalone exercise with no blueprint-specific skins
        index.exerciseToSkins.set('standalone-exercise', []);

        const result = selectSkinForExercises(['standalone-exercise'], [], index);

        // Should get a global skin
        expect(result[0]).not.toBeNull();
        expect(['global-skin-1', 'global-skin-2']).toContain(result[0]?.id);
      });

      it('applies same global skin to all exercises in blueprint group', () => {
        const index = createIndexWithGlobalSkins();
        // Remove blueprint-specific skins, only global skins available
        index.exerciseToSkins.set('list-create-empty', []);
        index.exerciseToBlueprints.set('list-append-dynamic', [
          { blueprintId: 'collection-cli-app', beat: 2, totalBeats: 2, beatTitle: 'Add entries' },
        ]);
        index.exerciseToSkins.set('list-append-dynamic', []);

        const result = selectSkinForExercises(['list-create-empty', 'list-append-dynamic'], [], index);

        // Both should get the same skin
        expect(result[0]).not.toBeNull();
        expect(result[1]).not.toBeNull();
        expect(result[0]?.id).toBe(result[1]?.id);
        // And it should be a global skin
        expect(['global-skin-1', 'global-skin-2']).toContain(result[0]?.id);
      });
    });
  });
});
