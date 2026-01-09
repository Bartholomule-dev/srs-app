import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadBlueprints,
  loadSkins,
  buildPathIndex,
  getPathIndex,
  clearPathIndexCache,
} from '@/lib/paths/loader';

describe('Path Loader', () => {
  beforeAll(() => {
    clearPathIndexCache();
  });

  describe('loadBlueprints', () => {
    it('loads all blueprints from YAML files', async () => {
      const blueprints = await loadBlueprints();

      expect(blueprints.length).toBeGreaterThanOrEqual(1);
      const cliApp = blueprints.find(b => b.id === 'collection-cli-app');
      expect(cliApp).toBeDefined();
      expect(cliApp?.beats.length).toBe(8);
    });

    it('validates blueprint structure', async () => {
      const blueprints = await loadBlueprints();

      for (const bp of blueprints) {
        expect(bp.id).toBeDefined();
        expect(bp.title).toBeDefined();
        expect(bp.beats.length).toBeGreaterThan(0);
        expect(['beginner', 'intermediate', 'advanced']).toContain(bp.difficulty);
      }
    });
  });

  describe('loadSkins', () => {
    it('loads all skins from YAML files', async () => {
      const skins = await loadSkins();

      expect(skins.length).toBeGreaterThanOrEqual(5);
      const taskManager = skins.find(s => s.id === 'task-manager');
      expect(taskManager).toBeDefined();
      expect(taskManager?.vars.list_name).toBe('tasks');
    });

    it('validates skin structure', async () => {
      const skins = await loadSkins();

      for (const skin of skins) {
        expect(skin.id).toBeDefined();
        expect(skin.title).toBeDefined();
        expect(skin.icon).toBeDefined();
        // blueprints is optional for global skins, required vars must be present
        if (skin.blueprints) {
          expect(skin.blueprints.length).toBeGreaterThan(0);
        }
        expect(skin.vars.list_name).toBeDefined();
      }
    });
  });

  describe('buildPathIndex', () => {
    it('builds lookup maps for blueprints and skins', async () => {
      const blueprints = await loadBlueprints();
      const skins = await loadSkins();
      const index = buildPathIndex(blueprints, skins);

      expect(index.blueprints.size).toBeGreaterThanOrEqual(1);
      expect(index.skins.size).toBeGreaterThanOrEqual(5);
    });

    it('maps exercises to blueprints', async () => {
      const blueprints = await loadBlueprints();
      const skins = await loadSkins();
      const index = buildPathIndex(blueprints, skins);

      const refs = index.exerciseToBlueprints.get('list-create-empty');
      expect(refs).toBeDefined();
      expect(refs?.length).toBeGreaterThanOrEqual(1);
      expect(refs?.[0].beat).toBe(1);
    });

    it('maps exercises to compatible skins', async () => {
      const blueprints = await loadBlueprints();
      const skins = await loadSkins();
      const index = buildPathIndex(blueprints, skins);

      const skinIds = index.exerciseToSkins.get('list-create-empty');
      expect(skinIds).toBeDefined();
      expect(skinIds?.length).toBeGreaterThanOrEqual(5);
      expect(skinIds).toContain('task-manager');
    });
  });

  describe('getPathIndex', () => {
    it('returns singleton index', async () => {
      clearPathIndexCache();
      const index1 = await getPathIndex();
      const index2 = await getPathIndex();

      expect(index1).toBe(index2);
    });
  });

  describe('Global Skins (no blueprints restriction)', () => {
    it('loads skins with optional blueprints field', async () => {
      const index = await getPathIndex();

      // Check that skins exist (some may be global, some blueprint-specific)
      expect(index.skins.size).toBeGreaterThan(0);
    });

    it('skins use list_name per schema requirement', async () => {
      const index = await getPathIndex();

      for (const [id, skin] of index.skins) {
        // All skins should have list_name (not collection_var)
        expect(skin.vars.list_name).toBeDefined();
        expect(typeof skin.vars.list_name).toBe('string');
      }
    });

    it('global skins (no blueprints) are loaded correctly', async () => {
      const index = await getPathIndex();

      // Find any skin without blueprints array
      const globalSkins = Array.from(index.skins.values()).filter(s => !s.blueprints);

      // Verify global skins have all required fields
      for (const skin of globalSkins) {
        expect(skin.id).toBeDefined();
        expect(skin.title).toBeDefined();
        expect(skin.icon).toBeDefined();
        expect(skin.vars).toBeDefined();
        expect(skin.vars.list_name).toBeDefined();
      }

      // The index should handle both global and blueprint-restricted skins
      expect(index.skins.size).toBeGreaterThan(0);
    });

    it('blueprint-restricted skins have valid blueprints array', async () => {
      const index = await getPathIndex();

      // Find skins with blueprints restriction
      const restrictedSkins = Array.from(index.skins.values()).filter(s => s.blueprints);

      for (const skin of restrictedSkins) {
        expect(Array.isArray(skin.blueprints)).toBe(true);
        expect(skin.blueprints!.length).toBeGreaterThan(0);

        // Each referenced blueprint should exist
        for (const bpId of skin.blueprints!) {
          expect(index.blueprints.has(bpId)).toBe(true);
        }
      }
    });

    it('skins can have optional dataPack', async () => {
      const index = await getPathIndex();

      // Some skins may have dataPack, some may not - both are valid
      for (const [id, skin] of index.skins) {
        if (skin.dataPack) {
          expect(skin.dataPack.list_sample).toBeDefined();
          expect(Array.isArray(skin.dataPack.list_sample)).toBe(true);
        }
      }
    });

    it('global skins are not pre-indexed to exercises', async () => {
      const index = await getPathIndex();

      // Find any global skin
      const globalSkins = Array.from(index.skins.values()).filter(s => !s.blueprints);

      // Global skins should be in the skins Map but not pre-indexed in exerciseToSkins
      // (they are handled at lookup time for efficiency)
      for (const globalSkin of globalSkins) {
        // The skin should exist in the index
        expect(index.skins.has(globalSkin.id)).toBe(true);

        // But should not appear in any exerciseToSkins entry
        // (since we only index blueprint-restricted skins)
        for (const [exercise, skinIds] of index.exerciseToSkins) {
          expect(skinIds.includes(globalSkin.id)).toBe(false);
        }
      }
    });

    it('validates skin required fields', async () => {
      const skins = await loadSkins();

      for (const skin of skins) {
        // Required fields for all skins
        expect(skin.id).toBeDefined();
        expect(skin.title).toBeDefined();
        expect(skin.icon).toBeDefined();
        expect(skin.vars).toBeDefined();
        expect(skin.vars.list_name).toBeDefined();
        expect(skin.vars.item_singular).toBeDefined();
        expect(skin.vars.item_plural).toBeDefined();
        expect(skin.vars.item_examples).toBeDefined();
        expect(skin.vars.record_keys).toBeDefined();

        // blueprints is optional
        if (skin.blueprints !== undefined) {
          expect(Array.isArray(skin.blueprints)).toBe(true);
        }
      }
    });
  });
});
