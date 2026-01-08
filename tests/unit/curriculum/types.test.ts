import { describe, it, expect } from 'vitest';
import type { SubconceptTeaching, SubconceptDefinition } from '@/lib/curriculum/types';

describe('Curriculum Types', () => {
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
