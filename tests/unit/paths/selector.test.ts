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
});
