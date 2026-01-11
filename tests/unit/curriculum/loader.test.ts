import { describe, it, expect } from 'vitest';
import {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
  getCurriculumConcepts,
  loadCurriculum,
  getSupportedLanguages,
} from '@/lib/curriculum/loader';

describe('Curriculum Loader', () => {
  describe('loadCurriculum', () => {
    it('loads Python curriculum by default', () => {
      const curriculum = loadCurriculum();

      expect(curriculum.language).toBe('python');
      expect(curriculum.version).toBeDefined();
      expect(curriculum.concepts.length).toBeGreaterThan(0);
    });

    it('loads Python curriculum explicitly', () => {
      const curriculum = loadCurriculum('python');

      expect(curriculum.language).toBe('python');
      expect(curriculum.concepts.length).toBeGreaterThan(10);
    });

    it('loads JavaScript curriculum', () => {
      const curriculum = loadCurriculum('javascript');

      expect(curriculum.language).toBe('javascript');
      expect(curriculum.version).toBe('1.1.0');
      expect(curriculum.concepts.length).toBeGreaterThan(0);
    });

    it('throws error for unknown language', () => {
      expect(() => loadCurriculum('rust')).toThrow('Unknown language: rust');
    });
  });

  describe('getSupportedLanguages', () => {
    it('returns all supported languages', () => {
      const languages = getSupportedLanguages();

      expect(languages).toContain('python');
      expect(languages).toContain('javascript');
      expect(languages.length).toBe(2);
    });
  });

  describe('getSubconceptTeaching', () => {
    it('returns teaching content for a valid Python subconcept (default)', () => {
      const teaching = getSubconceptTeaching('for');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toBeDefined();
      expect(teaching?.explanation.length).toBeGreaterThan(0);
      expect(teaching?.exampleSlug).toBeDefined();
    });

    it('returns teaching content for a valid Python subconcept (explicit)', () => {
      const teaching = getSubconceptTeaching('variables', 'python');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toContain('assignment');
    });

    it('returns teaching content for a valid JavaScript subconcept', () => {
      const teaching = getSubconceptTeaching('variables', 'javascript');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toContain('let');
      expect(teaching?.explanation).toContain('const');
    });

    it('returns teaching content for JavaScript for-of subconcept', () => {
      const teaching = getSubconceptTeaching('for-of', 'javascript');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toContain('iteration');
      expect(teaching?.exampleCode).toContain('for (const item of');
    });

    it('returns null for unknown subconcept', () => {
      const teaching = getSubconceptTeaching('nonexistent-subconcept');

      expect(teaching).toBeNull();
    });

    it('returns null for Python-only subconcept when querying JavaScript', () => {
      const teaching = getSubconceptTeaching('list-comp', 'javascript');

      expect(teaching).toBeNull();
    });
  });

  describe('getSubconceptDefinition', () => {
    it('returns full definition for a valid Python subconcept (default)', () => {
      const definition = getSubconceptDefinition('for');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('For Loops');
      expect(definition?.concept).toBe('loops');
      expect(definition?.prereqs).toContain('lists');
      expect(definition?.teaching).toBeDefined();
    });

    it('returns full definition for a valid Python subconcept (explicit)', () => {
      const definition = getSubconceptDefinition('variables', 'python');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('Variables');
      expect(definition?.concept).toBe('foundations');
    });

    it('returns full definition for a valid JavaScript subconcept', () => {
      const definition = getSubconceptDefinition('for-of', 'javascript');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('For-Of Loops');
      expect(definition?.concept).toBe('loops');
      expect(definition?.teaching).toBeDefined();
    });

    it('returns definition for JavaScript async-await subconcept', () => {
      const definition = getSubconceptDefinition('async-await', 'javascript');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('Async / Await');
      expect(definition?.concept).toBe('async');
      expect(definition?.prereqs).toContain('promises');
    });

    it('returns null for unknown subconcept', () => {
      const definition = getSubconceptDefinition('nonexistent');

      expect(definition).toBeNull();
    });

    it('returns null for Python-only subconcept when querying JavaScript', () => {
      const definition = getSubconceptDefinition('dict-comp', 'javascript');

      expect(definition).toBeNull();
    });
  });

  describe('getAllSubconcepts', () => {
    it('returns all Python subconcept slugs (default)', () => {
      const subconcepts = getAllSubconcepts();

      expect(subconcepts.length).toBeGreaterThan(30); // We have ~42 Python subconcepts
      expect(subconcepts).toContain('for');
      expect(subconcepts).toContain('variables');
      expect(subconcepts).toContain('list-comp');
    });

    it('returns all Python subconcept slugs (explicit)', () => {
      const subconcepts = getAllSubconcepts('python');

      expect(subconcepts.length).toBeGreaterThan(30);
      expect(subconcepts).toContain('for');
      expect(subconcepts).toContain('dict-comp');
    });

    it('returns all JavaScript subconcept slugs', () => {
      const subconcepts = getAllSubconcepts('javascript');

      expect(subconcepts.length).toBeGreaterThan(5);
      expect(subconcepts).toContain('variables');
      expect(subconcepts).toContain('hoisting');
      expect(subconcepts).toContain('for-of');
      expect(subconcepts).toContain('async-await');
      expect(subconcepts).toContain('promises');
    });

    it('JavaScript subconcepts do not include Python-specific ones', () => {
      const subconcepts = getAllSubconcepts('javascript');

      expect(subconcepts).not.toContain('list-comp');
      expect(subconcepts).not.toContain('dict-comp');
    });
  });

  describe('getCurriculumConcepts', () => {
    it('returns Python concepts by default', () => {
      const concepts = getCurriculumConcepts();

      expect(concepts.length).toBeGreaterThan(10);
      expect(concepts.find((c) => c.slug === 'foundations')).toBeDefined();
      expect(concepts.find((c) => c.slug === 'loops')).toBeDefined();
    });

    it('returns Python concepts explicitly', () => {
      const concepts = getCurriculumConcepts('python');

      expect(concepts.length).toBeGreaterThan(10);
      expect(concepts.find((c) => c.slug === 'comprehensions')).toBeDefined();
    });

    it('returns JavaScript concepts', () => {
      const concepts = getCurriculumConcepts('javascript');

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.find((c) => c.slug === 'foundations')).toBeDefined();
      expect(concepts.find((c) => c.slug === 'async')).toBeDefined();
    });

    it('JavaScript concepts have correct structure', () => {
      const concepts = getCurriculumConcepts('javascript');
      const asyncConcept = concepts.find((c) => c.slug === 'async');

      expect(asyncConcept).toBeDefined();
      expect(asyncConcept?.name).toBe('Async');
      expect(asyncConcept?.prereqs).toContain('functions');
      expect(asyncConcept?.prereqs).toContain('error-handling');
      expect(asyncConcept?.subconcepts).toContain('promises');
      expect(asyncConcept?.subconcepts).toContain('async-await');
      expect(asyncConcept?.subconcepts).toContain('async-patterns');
    });
  });
});
