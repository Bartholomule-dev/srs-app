// tests/unit/paths/types.test.ts
import { describe, it, expect } from 'vitest';
import type {
  Blueprint,
  Beat,
  Skin,
  SkinVars,
  PathIndex,
  BlueprintRef,
  SkinnedCard,
} from '@/lib/paths/types';

describe('Path Types', () => {
  describe('Blueprint', () => {
    it('defines required fields', () => {
      const blueprint: Blueprint = {
        id: 'collection-cli-app',
        title: 'Build a CLI Collection App',
        description: 'Learn to store, display, and persist data',
        difficulty: 'beginner',
        concepts: ['collections', 'loops'],
        beats: [
          { beat: 1, exercise: 'list-create-empty', title: 'Create storage' },
        ],
      };

      expect(blueprint.id).toBe('collection-cli-app');
      expect(blueprint.beats[0].beat).toBe(1);
    });

    it('validates difficulty levels', () => {
      const validDifficulties: Blueprint['difficulty'][] = [
        'beginner',
        'intermediate',
        'advanced',
      ];
      validDifficulties.forEach((d) =>
        expect(['beginner', 'intermediate', 'advanced']).toContain(d)
      );
    });
  });

  describe('Beat', () => {
    it('defines beat structure', () => {
      const beat: Beat = {
        beat: 1,
        exercise: 'list-create-empty',
        title: 'Create storage',
      };

      expect(beat.beat).toBe(1);
      expect(beat.exercise).toBe('list-create-empty');
      expect(beat.title).toBe('Create storage');
    });
  });

  describe('SkinVars', () => {
    it('defines variable structure', () => {
      const vars: SkinVars = {
        list_name: 'tasks',
        item_singular: 'task',
        item_plural: 'tasks',
        item_examples: ['buy groceries', 'call mom'],
        record_keys: ['title', 'done', 'priority'],
      };

      expect(vars.list_name).toBe('tasks');
      expect(vars.item_examples).toHaveLength(2);
    });

    it('allows additional custom variables', () => {
      const vars: SkinVars = {
        list_name: 'playlist',
        item_singular: 'song',
        item_plural: 'songs',
        item_examples: ['Bohemian Rhapsody', 'Stairway to Heaven'],
        record_keys: ['title', 'artist', 'duration'],
        custom_field: 'custom value',
        custom_array: ['a', 'b', 'c'],
      };

      expect(vars.custom_field).toBe('custom value');
      expect(vars.custom_array).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Skin', () => {
    it('defines required fields', () => {
      const skin: Skin = {
        id: 'task-manager',
        title: 'Task Manager',
        icon: '✅',
        blueprints: ['collection-cli-app'],
        vars: {
          list_name: 'tasks',
          item_singular: 'task',
          item_plural: 'tasks',
          item_examples: ['buy groceries', 'call mom'],
          record_keys: ['title', 'done', 'priority'],
        },
        contexts: {
          'list-create-empty': 'Every task manager needs somewhere to store tasks.',
        },
      };

      expect(skin.id).toBe('task-manager');
      expect(skin.vars.list_name).toBe('tasks');
    });

    it('supports multiple blueprints', () => {
      const skin: Skin = {
        id: 'music-player',
        title: 'Music Player',
        icon: '🎵',
        blueprints: ['collection-cli-app', 'file-io-app'],
        vars: {
          list_name: 'playlist',
          item_singular: 'song',
          item_plural: 'songs',
          item_examples: ['Hey Jude', 'Hotel California'],
          record_keys: ['title', 'artist'],
        },
        contexts: {},
      };

      expect(skin.blueprints).toHaveLength(2);
      expect(skin.blueprints).toContain('file-io-app');
    });
  });

  describe('BlueprintRef', () => {
    it('provides beat reference info', () => {
      const ref: BlueprintRef = {
        blueprintId: 'collection-cli-app',
        beat: 3,
        totalBeats: 8,
        beatTitle: 'Display items',
      };

      expect(ref.blueprintId).toBe('collection-cli-app');
      expect(ref.beat).toBe(3);
      expect(ref.totalBeats).toBe(8);
    });
  });

  describe('PathIndex', () => {
    it('provides lookup maps', () => {
      const index: PathIndex = {
        blueprints: new Map(),
        skins: new Map(),
        exerciseToBlueprints: new Map(),
        exerciseToSkins: new Map(),
      };

      expect(index.blueprints).toBeInstanceOf(Map);
      expect(index.skins).toBeInstanceOf(Map);
      expect(index.exerciseToBlueprints).toBeInstanceOf(Map);
      expect(index.exerciseToSkins).toBeInstanceOf(Map);
    });

    it('can store and retrieve blueprints', () => {
      const blueprint: Blueprint = {
        id: 'test-blueprint',
        title: 'Test Blueprint',
        description: 'A test',
        difficulty: 'beginner',
        concepts: ['basics'],
        beats: [{ beat: 1, exercise: 'test-exercise', title: 'Test' }],
      };

      const index: PathIndex = {
        blueprints: new Map([[blueprint.id, blueprint]]),
        skins: new Map(),
        exerciseToBlueprints: new Map(),
        exerciseToSkins: new Map(),
      };

      expect(index.blueprints.get('test-blueprint')).toBe(blueprint);
    });
  });

  describe('SkinnedCard', () => {
    it('extends session card with skin context', () => {
      const card: SkinnedCard = {
        exerciseSlug: 'list-create-empty',
        skinId: 'task-manager',
        blueprintId: 'collection-cli-app',
        beat: 1,
        totalBeats: 8,
        beatTitle: 'Create storage',
        context: 'Every task manager needs somewhere to store tasks.',
      };

      expect(card.beat).toBe(1);
      expect(card.skinId).toBe('task-manager');
      expect(card.context).toBe('Every task manager needs somewhere to store tasks.');
    });

    it('allows null values for non-path exercises', () => {
      const card: SkinnedCard = {
        exerciseSlug: 'standalone-exercise',
        skinId: null,
        blueprintId: null,
        beat: null,
        totalBeats: null,
        beatTitle: null,
        context: null,
      };

      expect(card.skinId).toBeNull();
      expect(card.blueprintId).toBeNull();
      expect(card.beat).toBeNull();
    });
  });
});
