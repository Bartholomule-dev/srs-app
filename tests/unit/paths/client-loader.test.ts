// tests/unit/paths/client-loader.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPathIndex,
  getPathIndexSync,
  clearPathIndexCache,
} from '@/lib/paths/client-loader';

describe('Client Loader', () => {
  beforeEach(() => {
    clearPathIndexCache();
  });

  describe('getPathIndexSync', () => {
    it('returns a valid PathIndex object', () => {
      const index = getPathIndexSync();

      expect(index).toBeDefined();
      expect(index.blueprints).toBeInstanceOf(Map);
      expect(index.skins).toBeInstanceOf(Map);
      expect(index.exerciseToBlueprints).toBeInstanceOf(Map);
      expect(index.exerciseToSkins).toBeInstanceOf(Map);
    });

    it('returns cached index on subsequent calls', () => {
      const index1 = getPathIndexSync();
      const index2 = getPathIndexSync();

      expect(index1).toBe(index2);
    });

    it('contains the expected blueprint', () => {
      const index = getPathIndexSync();

      expect(index.blueprints.has('collection-cli-app')).toBe(true);
      const blueprint = index.blueprints.get('collection-cli-app');
      expect(blueprint?.title).toBe('Build a CLI Collection App');
    });

    it('contains the expected skins', () => {
      const index = getPathIndexSync();

      expect(index.skins.size).toBeGreaterThanOrEqual(5);
      expect(index.skins.has('task-manager')).toBe(true);
      expect(index.skins.has('shopping-cart')).toBe(true);
      expect(index.skins.has('playlist-app')).toBe(true);
      expect(index.skins.has('recipe-book')).toBe(true);
      expect(index.skins.has('game-inventory')).toBe(true);
    });

    it('maps exercises to blueprints', () => {
      const index = getPathIndexSync();

      // list-create-empty should be in the collection-cli-app blueprint
      const refs = index.exerciseToBlueprints.get('list-create-empty');
      expect(refs).toBeDefined();
      expect(refs?.length).toBeGreaterThan(0);
      expect(refs?.[0].blueprintId).toBe('collection-cli-app');
    });

    it('maps exercises to skins', () => {
      const index = getPathIndexSync();

      // list-create-empty should have compatible skins
      const skinIds = index.exerciseToSkins.get('list-create-empty');
      expect(skinIds).toBeDefined();
      expect(skinIds?.length).toBeGreaterThan(0);
    });
  });

  describe('getPathIndex (async)', () => {
    it('returns the same result as getPathIndexSync', async () => {
      const syncIndex = getPathIndexSync();
      clearPathIndexCache();
      const asyncIndex = await getPathIndex();

      expect(asyncIndex.blueprints.size).toBe(syncIndex.blueprints.size);
      expect(asyncIndex.skins.size).toBe(syncIndex.skins.size);
    });

    it('resolves immediately', async () => {
      const start = Date.now();
      await getPathIndex();
      const elapsed = Date.now() - start;

      // Should be nearly instant since it's pre-loaded
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('clearPathIndexCache', () => {
    it('clears the cached index', () => {
      const index1 = getPathIndexSync();
      clearPathIndexCache();
      const index2 = getPathIndexSync();

      // After clearing cache, we get a new object
      // (though with same content since it's from the same JSON)
      expect(index1).not.toBe(index2);
    });
  });

  describe('PathIndex data integrity', () => {
    it('blueprint has correct beat count', () => {
      const index = getPathIndexSync();
      const blueprint = index.blueprints.get('collection-cli-app');

      expect(blueprint?.beats.length).toBe(23);
    });

    it('skins have icons', () => {
      const index = getPathIndexSync();

      for (const [_id, skin] of index.skins) {
        // Icon should be non-empty
        expect(skin.icon).toBeDefined();
        expect(skin.icon.length).toBeGreaterThan(0);
      }
    });

    it('skins have required vars', () => {
      const index = getPathIndexSync();

      for (const [_id, skin] of index.skins) {
        expect(skin.vars.list_name).toBeDefined();
        expect(skin.vars.item_singular).toBeDefined();
        expect(skin.vars.item_plural).toBeDefined();
      }
    });

    it('exercises are correctly mapped to multiple skins', () => {
      const index = getPathIndexSync();

      // list-create-empty should be compatible with multiple skins (at least 2)
      const skinIds = index.exerciseToSkins.get('list-create-empty');
      expect(skinIds?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
