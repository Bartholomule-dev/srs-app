import { describe, it, expect } from 'vitest';
import {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
} from '@/lib/curriculum/loader';

describe('Curriculum Loader', () => {
  describe('getSubconceptTeaching', () => {
    it('returns teaching content for a valid subconcept', () => {
      const teaching = getSubconceptTeaching('for');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toBeDefined();
      expect(teaching?.explanation.length).toBeGreaterThan(0);
      expect(teaching?.exampleSlug).toBeDefined();
    });

    it('returns null for unknown subconcept', () => {
      const teaching = getSubconceptTeaching('nonexistent-subconcept');

      expect(teaching).toBeNull();
    });
  });

  describe('getSubconceptDefinition', () => {
    it('returns full definition for a valid subconcept', () => {
      const definition = getSubconceptDefinition('for');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('For Loops');
      expect(definition?.concept).toBe('control-flow');
      expect(definition?.prereqs).toContain('lists');
      expect(definition?.teaching).toBeDefined();
    });

    it('returns null for unknown subconcept', () => {
      const definition = getSubconceptDefinition('nonexistent');

      expect(definition).toBeNull();
    });
  });

  describe('getAllSubconcepts', () => {
    it('returns all subconcept slugs', () => {
      const subconcepts = getAllSubconcepts();

      expect(subconcepts.length).toBeGreaterThan(30); // We have ~42 subconcepts
      expect(subconcepts).toContain('for');
      expect(subconcepts).toContain('variables');
      expect(subconcepts).toContain('list-comp');
    });
  });
});
