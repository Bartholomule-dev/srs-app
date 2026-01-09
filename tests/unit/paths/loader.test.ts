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
        expect(skin.blueprints.length).toBeGreaterThan(0);
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
});
