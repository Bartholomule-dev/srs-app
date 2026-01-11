// tests/unit/paths/client-loader.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getPathIndex,
  getPathIndexSync,
  getClientPathIndex,
  clearPathIndexCache,
} from '@/lib/paths/client-loader';

describe('Client Loader', () => {
  beforeEach(() => {
    clearPathIndexCache();
  });

  // ============================================================================
  // Pre-generated JSON tests (Python only)
  // ============================================================================

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

    it('clears specific language cache', () => {
      const index1 = getPathIndexSync();
      clearPathIndexCache('python');
      const index2 = getPathIndexSync();

      expect(index1).not.toBe(index2);
    });
  });

  describe('PathIndex data integrity', () => {
    it('blueprint has correct beat count', () => {
      const index = getPathIndexSync();
      const blueprint = index.blueprints.get('collection-cli-app');

      expect(blueprint?.beats.length).toBe(22);
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

  // ============================================================================
  // Fetch-based API tests (multi-language)
  // ============================================================================

  describe('getClientPathIndex', () => {
    // Mock fetch for these tests
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
      clearPathIndexCache();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('defaults to python', async () => {
      // For Python with cached pre-generated index, should not call fetch
      // First populate the cache
      getPathIndexSync();

      const index = await getClientPathIndex();

      // Should return from cache without fetching
      expect(mockFetch).not.toHaveBeenCalled();
      expect(index.blueprints).toBeInstanceOf(Map);
    });

    it('fetches from API for non-Python languages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      const index = await getClientPathIndex('javascript');

      expect(mockFetch).toHaveBeenCalledWith('/api/paths?language=javascript');
      expect(index.blueprints).toBeInstanceOf(Map);
    });

    it('includes language parameter in fetch URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      await getClientPathIndex('javascript');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/paths?language=javascript')
      );
    });

    it('encodes language parameter properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      // Test with a language that has special characters (edge case)
      await getClientPathIndex('type script');

      expect(mockFetch).toHaveBeenCalledWith('/api/paths?language=type%20script');
    });

    it('caches fetched results per language', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          blueprints: { 'test-bp': { id: 'test-bp', title: 'Test' } },
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      const index1 = await getClientPathIndex('javascript');
      const index2 = await getClientPathIndex('javascript');

      // Should only fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(index1).toBe(index2);
    });

    it('throws error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Database error' }),
      });

      await expect(getClientPathIndex('javascript')).rejects.toThrow('Database error');
    });

    it('handles fetch error with fallback message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      // When JSON parsing fails, falls back to statusText
      await expect(getClientPathIndex('unknown')).rejects.toThrow('Not Found');
    });

    it('deduplicates concurrent requests for same language', async () => {
      let resolveCount = 0;
      mockFetch.mockImplementation(() => {
        resolveCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            blueprints: {},
            skins: {},
            exerciseToBlueprints: {},
            exerciseToSkins: {},
          }),
        });
      });

      // Start multiple concurrent requests
      const promises = [
        getClientPathIndex('javascript'),
        getClientPathIndex('javascript'),
        getClientPathIndex('javascript'),
      ];

      await Promise.all(promises);

      // Should only have made one fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('fetches separately for different languages', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      await getClientPathIndex('javascript');
      await getClientPathIndex('typescript');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('/api/paths?language=javascript');
      expect(mockFetch).toHaveBeenCalledWith('/api/paths?language=typescript');
    });

    it('deserializes response into Maps', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {
            'test-bp': { id: 'test-bp', title: 'Test Blueprint', beats: [] },
          },
          skins: {
            'test-skin': { id: 'test-skin', title: 'Test Skin', vars: {} },
          },
          exerciseToBlueprints: {
            'ex-1': [{ blueprintId: 'test-bp', beat: 1, totalBeats: 5, beatTitle: 'Test' }],
          },
          exerciseToSkins: {
            'ex-1': ['test-skin'],
          },
        }),
      });

      const index = await getClientPathIndex('javascript');

      expect(index.blueprints).toBeInstanceOf(Map);
      expect(index.skins).toBeInstanceOf(Map);
      expect(index.exerciseToBlueprints).toBeInstanceOf(Map);
      expect(index.exerciseToSkins).toBeInstanceOf(Map);

      expect(index.blueprints.get('test-bp')?.title).toBe('Test Blueprint');
      expect(index.skins.get('test-skin')?.title).toBe('Test Skin');
      expect(index.exerciseToBlueprints.get('ex-1')?.[0]?.blueprintId).toBe('test-bp');
      expect(index.exerciseToSkins.get('ex-1')).toContain('test-skin');
    });
  });

  describe('clearPathIndexCache with fetch cache', () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
      clearPathIndexCache();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('clears fetch cache for specific language', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      // Populate cache
      await getClientPathIndex('javascript');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear and fetch again
      clearPathIndexCache('javascript');
      await getClientPathIndex('javascript');

      // Should have fetched again
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('clears all caches when no language specified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          blueprints: {},
          skins: {},
          exerciseToBlueprints: {},
          exerciseToSkins: {},
        }),
      });

      // Populate both caches
      getPathIndexSync(); // Python pre-generated
      await getClientPathIndex('javascript'); // Fetched

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear all
      clearPathIndexCache();

      // Both should need to reload
      const pyIndex1 = getPathIndexSync();
      await getClientPathIndex('javascript');

      // Python uses pre-generated, JavaScript fetches again
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
