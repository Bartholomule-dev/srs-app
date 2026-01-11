import { describe, it, expect } from 'vitest';
import type { SubconceptTeaching, SubconceptDefinition, Language } from '@/lib/curriculum/types';
import {
  PYTHON_CONCEPTS,
  JAVASCRIPT_CONCEPTS,
  isValidConcept,
} from '@/lib/curriculum/types';

describe('Curriculum Types', () => {
  describe('Language type', () => {
    it('accepts valid language values', () => {
      const python: Language = 'python';
      const javascript: Language = 'javascript';
      expect(python).toBe('python');
      expect(javascript).toBe('javascript');
    });
  });

  describe('PYTHON_CONCEPTS', () => {
    it('contains all expected Python concepts', () => {
      expect(PYTHON_CONCEPTS).toContain('foundations');
      expect(PYTHON_CONCEPTS).toContain('strings');
      expect(PYTHON_CONCEPTS).toContain('numbers-booleans');
      expect(PYTHON_CONCEPTS).toContain('conditionals');
      expect(PYTHON_CONCEPTS).toContain('collections');
      expect(PYTHON_CONCEPTS).toContain('loops');
      expect(PYTHON_CONCEPTS).toContain('functions');
      expect(PYTHON_CONCEPTS).toContain('comprehensions');
      expect(PYTHON_CONCEPTS).toContain('error-handling');
      expect(PYTHON_CONCEPTS).toContain('oop');
      expect(PYTHON_CONCEPTS).toContain('modules-files');
    });

    it('has exactly 11 concepts', () => {
      expect(PYTHON_CONCEPTS).toHaveLength(11);
    });

    it('does not contain JavaScript-specific concepts', () => {
      expect(PYTHON_CONCEPTS).not.toContain('arrays-objects');
      expect(PYTHON_CONCEPTS).not.toContain('async');
      expect(PYTHON_CONCEPTS).not.toContain('modules-dom');
    });
  });

  describe('JAVASCRIPT_CONCEPTS', () => {
    it('contains all expected JavaScript concepts', () => {
      expect(JAVASCRIPT_CONCEPTS).toContain('foundations');
      expect(JAVASCRIPT_CONCEPTS).toContain('strings');
      expect(JAVASCRIPT_CONCEPTS).toContain('numbers-booleans');
      expect(JAVASCRIPT_CONCEPTS).toContain('conditionals');
      expect(JAVASCRIPT_CONCEPTS).toContain('arrays-objects');
      expect(JAVASCRIPT_CONCEPTS).toContain('loops');
      expect(JAVASCRIPT_CONCEPTS).toContain('functions');
      expect(JAVASCRIPT_CONCEPTS).toContain('async');
      expect(JAVASCRIPT_CONCEPTS).toContain('error-handling');
      expect(JAVASCRIPT_CONCEPTS).toContain('oop');
      expect(JAVASCRIPT_CONCEPTS).toContain('modules-dom');
    });

    it('has exactly 11 concepts', () => {
      expect(JAVASCRIPT_CONCEPTS).toHaveLength(11);
    });

    it('does not contain Python-specific concepts', () => {
      expect(JAVASCRIPT_CONCEPTS).not.toContain('collections');
      expect(JAVASCRIPT_CONCEPTS).not.toContain('comprehensions');
      expect(JAVASCRIPT_CONCEPTS).not.toContain('modules-files');
    });
  });

  describe('isValidConcept', () => {
    describe('for Python', () => {
      it('returns true for valid Python concepts', () => {
        expect(isValidConcept('foundations', 'python')).toBe(true);
        expect(isValidConcept('collections', 'python')).toBe(true);
        expect(isValidConcept('comprehensions', 'python')).toBe(true);
        expect(isValidConcept('modules-files', 'python')).toBe(true);
      });

      it('returns false for JavaScript-only concepts', () => {
        expect(isValidConcept('arrays-objects', 'python')).toBe(false);
        expect(isValidConcept('async', 'python')).toBe(false);
        expect(isValidConcept('modules-dom', 'python')).toBe(false);
      });

      it('returns false for invalid concepts', () => {
        expect(isValidConcept('not-a-concept', 'python')).toBe(false);
        expect(isValidConcept('', 'python')).toBe(false);
      });
    });

    describe('for JavaScript', () => {
      it('returns true for valid JavaScript concepts', () => {
        expect(isValidConcept('foundations', 'javascript')).toBe(true);
        expect(isValidConcept('arrays-objects', 'javascript')).toBe(true);
        expect(isValidConcept('async', 'javascript')).toBe(true);
        expect(isValidConcept('modules-dom', 'javascript')).toBe(true);
      });

      it('returns false for Python-only concepts', () => {
        expect(isValidConcept('collections', 'javascript')).toBe(false);
        expect(isValidConcept('comprehensions', 'javascript')).toBe(false);
        expect(isValidConcept('modules-files', 'javascript')).toBe(false);
      });

      it('returns false for invalid concepts', () => {
        expect(isValidConcept('not-a-concept', 'javascript')).toBe(false);
        expect(isValidConcept('', 'javascript')).toBe(false);
      });
    });

    describe('for unsupported languages', () => {
      it('returns false for any concept', () => {
        expect(isValidConcept('foundations', 'ruby')).toBe(false);
        expect(isValidConcept('foundations', 'go')).toBe(false);
        expect(isValidConcept('foundations', '')).toBe(false);
      });
    });

    describe('shared concepts', () => {
      it('validates concepts that exist in both languages', () => {
        const sharedConcepts = [
          'foundations',
          'strings',
          'numbers-booleans',
          'conditionals',
          'loops',
          'functions',
          'error-handling',
          'oop',
        ];

        for (const concept of sharedConcepts) {
          expect(isValidConcept(concept, 'python')).toBe(true);
          expect(isValidConcept(concept, 'javascript')).toBe(true);
        }
      });
    });
  });

  describe('SubconceptTeaching', () => {
    it('has required explanation and exampleSlug fields', () => {
      const teaching: SubconceptTeaching = {
        explanation: 'For loops iterate over sequences.',
        exampleSlug: 'for-loop-range-intro',
      };

      expect(teaching.explanation).toBe('For loops iterate over sequences.');
      expect(teaching.exampleSlug).toBe('for-loop-range-intro');
    });

    it('supports exampleCode field', () => {
      const teaching: SubconceptTeaching = {
        explanation: 'Use print() to display output.',
        exampleCode: 'print("Hello, World!")',
      };
      expect(teaching.exampleCode).toBe('print("Hello, World!")');
    });

    it('allows optional exampleSlug for backward compatibility', () => {
      const teaching: SubconceptTeaching = {
        explanation: 'Use print() to display output.',
        exampleCode: 'print("Hello, World!")',
        exampleSlug: 'print-string', // deprecated but allowed
      };
      expect(teaching.exampleSlug).toBe('print-string');
    });
  });

  describe('SubconceptDefinition', () => {
    it('includes teaching field with explanation and exampleSlug', () => {
      const subconcept: SubconceptDefinition = {
        name: 'For Loops',
        concept: 'loops',
        prereqs: ['foundations'],
        teaching: {
          explanation: 'For loops iterate over sequences.',
          exampleSlug: 'for-loop-range-intro',
        },
      };

      expect(subconcept.name).toBe('For Loops');
      expect(subconcept.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(subconcept.teaching.exampleSlug).toBe('for-loop-range-intro');
    });
  });
});
