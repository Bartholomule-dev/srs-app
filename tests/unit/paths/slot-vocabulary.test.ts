// tests/unit/paths/slot-vocabulary.test.ts
import { describe, it, expect } from 'vitest';
import {
  STANDARD_SLOTS,
  SlotVocabulary,
  validateSkinVarsHasRequiredSlots,
  REQUIRED_SLOTS,
} from '@/lib/paths/slot-vocabulary';

describe('Slot Vocabulary', () => {
  it('defines 12 standard slots', () => {
    expect(Object.keys(STANDARD_SLOTS)).toHaveLength(12);
  });

  it('includes collection slots (using existing names)', () => {
    // IMPORTANT: These match existing SkinVars in types.ts
    expect(STANDARD_SLOTS.list_name).toBeDefined();
    expect(STANDARD_SLOTS.item_singular).toBeDefined();
    expect(STANDARD_SLOTS.item_plural).toBeDefined();
  });

  it('includes attribute slots', () => {
    expect(STANDARD_SLOTS.attr_key_1).toBeDefined();
    expect(STANDARD_SLOTS.attr_key_2).toBeDefined();
    expect(STANDARD_SLOTS.id_var).toBeDefined();
  });

  it('includes file slots', () => {
    expect(STANDARD_SLOTS.filename).toBeDefined();
    expect(STANDARD_SLOTS.filetype).toBeDefined();
  });

  it('includes misc slots', () => {
    expect(STANDARD_SLOTS.user_role).toBeDefined();
    expect(STANDARD_SLOTS.status_var).toBeDefined();
    expect(STANDARD_SLOTS.action_verb).toBeDefined();
    expect(STANDARD_SLOTS.entity_name).toBeDefined();
  });

  it('has descriptions and examples for each slot', () => {
    for (const [key, slot] of Object.entries(STANDARD_SLOTS)) {
      expect(slot.description).toBeDefined();
      expect(slot.description.length).toBeGreaterThan(0);
      expect(slot.examples).toBeInstanceOf(Array);
      expect(slot.examples.length).toBeGreaterThan(0);
    }
  });

  describe('validateSkinVarsHasRequiredSlots', () => {
    it('passes when all required slots present', () => {
      const vars = {
        list_name: 'tasks',
        item_singular: 'task',
        item_plural: 'tasks',
        item_examples: ['task1'],
        record_keys: ['title'],
      };
      expect(validateSkinVarsHasRequiredSlots(vars)).toEqual({ valid: true, missing: [] });
    });

    it('reports missing slots', () => {
      const vars = { list_name: 'tasks' };
      const result = validateSkinVarsHasRequiredSlots(vars);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('item_singular');
    });

    it('reports all missing slots', () => {
      const vars = {};
      const result = validateSkinVarsHasRequiredSlots(vars);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(REQUIRED_SLOTS);
    });

    it('allows extra slots beyond required', () => {
      const vars = {
        list_name: 'tasks',
        item_singular: 'task',
        item_plural: 'tasks',
        item_examples: ['task1'],
        record_keys: ['title'],
        // Extra optional slots
        attr_key_1: 'name',
        filename: 'data.txt',
      };
      expect(validateSkinVarsHasRequiredSlots(vars)).toEqual({ valid: true, missing: [] });
    });
  });

  describe('SlotVocabulary type', () => {
    it('type should include all 12 slots', () => {
      // This is a type-level test - if it compiles, it passes
      const vocab: SlotVocabulary = {
        list_name: 'items',
        item_singular: 'item',
        item_plural: 'items',
        attr_key_1: 'name',
        attr_key_2: 'price',
        id_var: 'id',
        filename: 'data.txt',
        filetype: 'txt',
        user_role: 'admin',
        status_var: 'active',
        action_verb: 'add',
        entity_name: 'Item',
      };
      expect(vocab).toBeDefined();
    });
  });
});
